import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { QueueEvents } from 'bullmq';

import assessmentRoutes from './routes/assessmentRoutes';
import { redisConnection } from './queues/assessmentQueue';
import { startAssessmentWorker } from './workers/assessmentWorker';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: clientUrl,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads as static folder
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/assessments', assessmentRoutes);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-job', (jobId: string) => {
    socket.join(`job:${jobId}`);
    console.log(`Socket ${socket.id} joined room: job:${jobId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Setup Queue Events for real-time socket progress propagation
const setupQueueEvents = () => {
  const queueEvents = new QueueEvents('assessment-generation', {
    connection: redisConnection
  });

  queueEvents.on('progress', ({ jobId, data }: { jobId: string; data: any }) => {
    console.log(`Job ${jobId} progress:`, data);
    // Emit progress to sockets in room
    io.to(`job:${jobId}`).emit('job-progress', {
      jobId,
      progress: data.progress,
      message: data.message
    });
  });

  queueEvents.on('completed', ({ jobId, returnvalue }: { jobId: string; returnvalue: any }) => {
    console.log(`Job ${jobId} completed:`, returnvalue);
    io.to(`job:${jobId}`).emit('job-completed', {
      jobId,
      assessmentId: returnvalue.assessmentId
    });
  });

  queueEvents.on('failed', ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.warn(`Job ${jobId} failed:`, failedReason);
    io.to(`job:${jobId}`).emit('job-failed', {
      jobId,
      error: failedReason || 'Job processing failed'
    });
  });
};

// Database Connection & Server Startup
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/veda-ai';

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');

    // Initialize BullMQ worker
    startAssessmentWorker();

    // Start Queue events listening
    setupQueueEvents();

    server.listen(PORT, () => {
      console.log(`VedaAI backend server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

startServer();
