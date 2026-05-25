import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface QuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

interface FormState {
  title: string;
  dueDate: string;
  instructions: string;
  questionTypes: QuestionTypeConfig[];
  uploadedFile: {
    name: string;
    size: number;
    type: string;
  } | null;
  step: number; // For wizard: 1 = Basic/Details, 2 = Generation/Progress
}

const initialState: FormState = {
  title: 'Quiz on Electricity',
  dueDate: '',
  instructions: '',
  questionTypes: [
    { type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { type: 'Short Questions', count: 3, marks: 2 },
    { type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { type: 'Numerical Problems', count: 5, marks: 5 }
  ],
  uploadedFile: null,
  step: 1
};

const assessmentFormSlice = createSlice({
  name: 'assessmentForm',
  initialState,
  reducers: {
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload;
    },
    setDueDate(state, action: PayloadAction<string>) {
      state.dueDate = action.payload;
    },
    setInstructions(state, action: PayloadAction<string>) {
      state.instructions = action.payload;
    },
    updateQuestionType(
      state,
      action: PayloadAction<{ index: number; field: 'type' | 'count' | 'marks'; value: any }>
    ) {
      const { index, field, value } = action.payload;
      if (state.questionTypes[index]) {
        if (field === 'type') {
          state.questionTypes[index].type = value;
        } else {
          state.questionTypes[index][field] = Math.max(1, Number(value));
        }
      }
    },
    addQuestionType(state) {
      state.questionTypes.push({
        type: 'Short Questions',
        count: 5,
        marks: 2
      });
    },
    removeQuestionType(state, action: PayloadAction<number>) {
      state.questionTypes.splice(action.payload, 1);
    },
    setUploadedFile(state, action: PayloadAction<FormState['uploadedFile']>) {
      state.uploadedFile = action.payload;
    },
    setStep(state, action: PayloadAction<number>) {
      state.step = action.payload;
    },
    resetForm(state) {
      return {
        ...initialState,
        dueDate: '',
        instructions: ''
      };
    }
  }
});

export const {
  setTitle,
  setDueDate,
  setInstructions,
  updateQuestionType,
  addQuestionType,
  removeQuestionType,
  setUploadedFile,
  setStep,
  resetForm
} = assessmentFormSlice.actions;

export default assessmentFormSlice.reducer;
