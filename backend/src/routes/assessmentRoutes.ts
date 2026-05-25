import { Router, Request, Response } from 'express';
import multer from 'multer';
import Assessment from '../models/Assessment';
import { assessmentQueue } from '../queues/assessmentQueue';
import { uploadFile, getPresignedUrl } from '../services/s3Service';
import { generateAssessmentPDF } from '../services/pdfService';

const router = Router();

const signAssessmentUrls = async (assessment: any) => {
  const obj = assessment.toObject();
  if (obj.fileUrl) {
    obj.fileUrl = await getPresignedUrl(obj.fileUrl);
  }
  if (obj.pdfUrl) {
    obj.pdfUrl = await getPresignedUrl(obj.pdfUrl);
  }
  return obj;
};

// Setup Multer to store uploaded files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limits
  }
});

/**
 * POST /api/assessments
 * Create a new assessment and trigger AI generation job
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { title, dueDate, instructions, criteria } = req.body;

    if (!title || !dueDate || !criteria) {
      return res.status(400).json({ error: 'Title, due date, and criteria are required fields.' });
    }

    const parsedCriteria = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;

    let fileUrl = '';
    let originalFileName = '';
    if (req.file) {
      originalFileName = req.file.originalname;
      // Upload memory buffer to S3 / Local fallback
      fileUrl = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    // Calculate total questions and marks from criteria
    let totalQuestions = 0;
    let totalMarks = 0;
    parsedCriteria.questionTypes.forEach((qt: any) => {
      totalQuestions += Number(qt.count);
      totalMarks += Number(qt.count) * Number(qt.marks);
    });

    // Create MongoDB document
    const assessment = new Assessment({
      title,
      dueDate: new Date(dueDate),
      instructions,
      criteria: {
        questionTypes: parsedCriteria.questionTypes,
        totalQuestions,
        totalMarks
      },
      sections: [],
      answerKey: [],
      fileUrl: fileUrl || undefined,
      status: 'pending'
    });

    await assessment.save();

    // Push job to BullMQ
    const job = await assessmentQueue.add('generate', {
      assessmentId: assessment._id.toString(),
      originalFileName
    });

    const signedAssessment = await signAssessmentUrls(assessment);
    return res.status(201).json({
      message: 'Assessment creation scheduled successfully.',
      assessment: signedAssessment,
      jobId: job.id
    });
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * GET /api/assessments
 * List all assessments
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assessments = await Assessment.find().sort({ createdAt: -1 });
    const signedAssessments = await Promise.all(
      assessments.map(async (a) => await signAssessmentUrls(a))
    );
    return res.status(200).json(signedAssessments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * GET /api/assessments/:id
 * Retrieve details of a specific assessment
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    const signedAssessment = await signAssessmentUrls(assessment);
    return res.status(200).json(signedAssessment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * DELETE /api/assessments/:id
 * Delete a specific assessment
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    return res.status(200).json({ message: 'Assessment deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * POST /api/assessments/:id/pdf
 * Render Puppeteer PDF for an assessment
 */
router.post('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    if (assessment.status !== 'completed') {
      return res.status(400).json({ error: 'Assessment is not fully generated yet. PDF cannot be rendered.' });
    }

    const pdfUrl = await generateAssessmentPDF(assessment);
    const presignedPdfUrl = await getPresignedUrl(pdfUrl);
    return res.status(200).json({ pdfUrl: presignedPdfUrl });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * POST /api/assessments/:id/regenerate
 * Trigger regeneration of assessment
 */
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    assessment.status = 'pending';
    assessment.error = undefined;
    assessment.sections = [];
    assessment.answerKey = [];
    assessment.pdfUrl = undefined;
    await assessment.save();

    const job = await assessmentQueue.add('generate', {
      assessmentId: assessment._id.toString()
    });

    const signedAssessment = await signAssessmentUrls(assessment);
    return res.status(200).json({
      message: 'Assessment regeneration task scheduled successfully.',
      assessment: signedAssessment,
      jobId: job.id
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

export default router;
