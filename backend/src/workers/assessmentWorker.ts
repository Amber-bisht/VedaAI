import { Worker, Job } from 'bullmq';
import { redisConnection } from '../queues/assessmentQueue';
import Assessment from '../models/Assessment';
import { getFileBuffer } from '../services/s3Service';
import { generateAssessmentAI } from '../services/openRouterService';
import pdfParse from 'pdf-parse';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect Mongoose inside worker if it hasn't been connected (BullMQ runs in process, but just in case)
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/veda-ai';
    await mongoose.connect(mongoUri);
  }
};

const parseTextFromFile = async (buffer: Buffer, fileName: string): Promise<string> => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  return buffer.toString('utf-8');
};

export const startAssessmentWorker = () => {
  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      console.log(`Processing assessment job: ${job.id}`);
      await connectDB();

      const { assessmentId, originalFileName } = job.data;
      const assessment = await Assessment.findById(assessmentId);

      if (!assessment) {
        throw new Error(`Assessment not found: ${assessmentId}`);
      }

      try {
        // Step 1: Update status to processing
        assessment.status = 'processing';
        await assessment.save();
        await job.updateProgress({ progress: 10, message: 'Initiated generation task...' });

        // Step 2: Download and parse file context if uploaded
        let contextText = '';
        if (assessment.fileUrl) {
          await job.updateProgress({ progress: 20, message: 'Downloading uploaded reference document...' });
          const fileBuffer = await getFileBuffer(assessment.fileUrl);

          await job.updateProgress({ progress: 40, message: 'Extracting text content from document...' });
          contextText = await parseTextFromFile(fileBuffer, originalFileName || 'document.txt');
        }

        // Step 3: Run AI Generation
        await job.updateProgress({ progress: 55, message: 'Sending request to OpenRouter AI Engine...' });
        const aiResponse = await generateAssessmentAI({
          dueDate: assessment.dueDate.toISOString(),
          instructions: assessment.instructions,
          questionTypes: assessment.criteria.questionTypes,
          contextText: contextText || undefined
        });

        // Step 4: Parse & validate output
        await job.updateProgress({ progress: 85, message: 'Parsing and validating assessment structure...' });
        
        if (!aiResponse || !aiResponse.sections) {
          throw new Error('AI generation did not return sections in expected format');
        }

        assessment.sections = aiResponse.sections;
        assessment.answerKey = aiResponse.answerKey || [];
        assessment.status = 'completed';
        await assessment.save();

        await job.updateProgress({ progress: 100, message: 'Assessment generation completed successfully!' });
        console.log(`Job completed successfully: ${job.id}`);
        return { assessmentId: assessment._id };
      } catch (err: any) {
        console.error(`Error processing job ${job.id}:`, err);
        assessment.status = 'failed';
        assessment.error = err.message || 'Unknown error occurred during AI generation';
        await assessment.save();
        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2
    }
  );

  worker.on('active', (job) => {
    console.log(`Job ${job.id} is active`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error:`, err);
  });

  console.log('BullMQ Assessment generation worker started.');
  return worker;
};
