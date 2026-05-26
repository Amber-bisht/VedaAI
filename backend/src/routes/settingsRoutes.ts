import { Router, Request, Response } from 'express';
import Settings from '../models/Settings';

const router = Router();

/**
 * GET /api/settings
 * Fetch global configuration settings
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create defaults if not present
      settings = new Settings({});
      await settings.save();
    }
    return res.status(200).json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * POST /api/settings
 * Update global configuration settings
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { schoolName, schoolAddress, subject, className, teacherName } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    if (schoolName !== undefined) settings.schoolName = schoolName;
    if (schoolAddress !== undefined) settings.schoolAddress = schoolAddress;
    if (subject !== undefined) settings.subject = subject;
    if (className !== undefined) settings.className = className;
    if (teacherName !== undefined) settings.teacherName = teacherName;

    await settings.save();
    return res.status(200).json({ message: 'Settings updated successfully.', settings });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

export default router;
