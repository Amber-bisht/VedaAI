import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

export interface ISection {
  title: string;
  instructions: string;
  questions: IQuestion[];
}

export interface IAnswerKeyItem {
  questionIndex: string; // e.g. "Section A, Q1" or standard sequential number
  answerText: string;
}

export interface IAssessment extends Document {
  title: string;
  subject: string;
  className: string;
  dueDate: Date;
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
  sections: ISection[];
  answerKey: IAnswerKeyItem[];
  fileUrl?: string; // S3 upload link
  pdfUrl?: string; // S3 PDF link
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], required: true },
  marks: { type: Number, required: true },
  options: { type: [String], default: undefined },
  correctAnswer: { type: String }
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  questions: [QuestionSchema]
});

const AnswerKeyItemSchema = new Schema<IAnswerKeyItem>({
  questionIndex: { type: String, required: true },
  answerText: { type: String, required: true }
});

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    dueDate: { type: Date, required: true },
    instructions: { type: String },
    criteria: {
      questionTypes: [
        {
          type: { type: String, required: true },
          count: { type: Number, required: true },
          marks: { type: Number, required: true }
        }
      ],
      totalQuestions: { type: Number, required: true },
      totalMarks: { type: Number, required: true }
    },
    sections: [SectionSchema],
    answerKey: [AnswerKeyItemSchema],
    fileUrl: { type: String },
    pdfUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    error: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IAssessment>('Assessment', AssessmentSchema);
