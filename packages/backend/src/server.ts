import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';

import dotenv from 'dotenv';
import { QueueEvents } from 'bullmq';

import assessmentRoutes from './routes/assessmentRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { redisConnection } from './queues/assessmentQueue';
import { startAssessmentWorker } from './workers/assessmentWorker';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS with multiple allowed origins
const clientUrlEnv = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = clientUrlEnv.split(',').map(url => url.trim());

// Always include the production frontend domain and local development origin
const defaultOrigins = ['http://localhost:3000', 'https://vedaai.amberbisht.me'];
defaultOrigins.forEach(origin => {
  if (!allowedOrigins.includes(origin)) {
    allowedOrigins.push(origin);
  }
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, or server-to-server)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// API Routes
app.use('/api/assessments', assessmentRoutes);
app.use('/api/settings', settingsRoutes);

// Socket.io initialization supporting multiple CORS origins
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
    connection: redisConnection as any
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
