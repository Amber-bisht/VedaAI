import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AssessmentData {
  _id: string;
  title: string;
  subject?: string;
  className?: string;
  dueDate: string;
  instructions?: string;
  criteria: {
    questionTypes: Array<{
      type: string;
      count: number;
      marks: number;
    }>;
    totalQuestions: number;
    totalMarks: number;
  };
  sections: Array<{
    title: string;
    instructions: string;
    questions: Array<{
      text: string;
      difficulty: 'Easy' | 'Moderate' | 'Challenging';
      marks: number;
      options?: string[];
      correctAnswer?: string;
    }>;
  }>;
  answerKey: Array<{
    questionIndex: string;
    answerText: string;
  }>;
  fileUrl?: string;
  pdfUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface ResultState {
  assessments: AssessmentData[];
  currentAssessment: AssessmentData | null;
  generation: {
    jobId: string | null;
    status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message: string;
    error: string | null;
  };
}

const initialState: ResultState = {
  assessments: [],
  currentAssessment: null,
  generation: {
    jobId: null,
    status: 'idle',
    progress: 0,
    message: '',
    error: null
  }
};

const assessmentResultSlice = createSlice({
  name: 'assessmentResult',
  initialState,
  reducers: {
    setAssessments(state, action: PayloadAction<AssessmentData[]>) {
      state.assessments = action.payload;
    },
    removeAssessmentFromState(state, action: PayloadAction<string>) {
      state.assessments = state.assessments.filter((a) => a._id !== action.payload);
      if (state.currentAssessment?._id === action.payload) {
        state.currentAssessment = null;
      }
    },
    setCurrentAssessment(state, action: PayloadAction<AssessmentData | null>) {
      state.currentAssessment = action.payload;
    },
    startGenerationJob(state, action: PayloadAction<string>) {
      state.generation.jobId = action.payload;
      state.generation.status = 'pending';
      state.generation.progress = 0;
      state.generation.message = 'Scheduling generation...';
      state.generation.error = null;
    },
    updateJobProgress(state, action: PayloadAction<{ progress: number; message: string }>) {
      state.generation.status = 'processing';
      state.generation.progress = action.payload.progress;
      state.generation.message = action.payload.message;
    },
    completeJob(state, action: PayloadAction<AssessmentData>) {
      state.generation.status = 'completed';
      state.generation.progress = 100;
      state.generation.message = 'Assessment generated successfully!';
      state.currentAssessment = action.payload;
      // Add or update in list
      const idx = state.assessments.findIndex((a) => a._id === action.payload._id);
      if (idx !== -1) {
        state.assessments[idx] = action.payload;
      } else {
        state.assessments.unshift(action.payload);
      }
    },
    failJob(state, action: PayloadAction<string>) {
      state.generation.status = 'failed';
      state.generation.error = action.payload;
      state.generation.message = 'AI generation failed.';
    },
    clearJobState(state) {
      state.generation = {
        jobId: null,
        status: 'idle',
        progress: 0,
        message: '',
        error: null
      };
    }
  }
});

export const {
  setAssessments,
  removeAssessmentFromState,
  setCurrentAssessment,
  startGenerationJob,
  updateJobProgress,
  completeJob,
  failJob,
  clearJobState
} = assessmentResultSlice.actions;

export default assessmentResultSlice.reducer;
