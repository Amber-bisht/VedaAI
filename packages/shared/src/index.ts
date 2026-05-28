/**
 * @veda-ai/shared — Common types used across frontend and backend
 */

// ─── Assessment Types ────────────────────────────────────────────

export type Difficulty = 'Easy' | 'Moderate' | 'Challenging';

export type AssessmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface IQuestion {
  text: string;
  difficulty: Difficulty;
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
  questionIndex: string;
  answerText: string;
}

export interface AssessmentCriteria {
  questionTypes: QuestionTypeConfig[];
  totalQuestions: number;
  totalMarks: number;
}

export interface IAssessmentBase {
  title: string;
  subject: string;
  className: string;
  dueDate: Date | string;
  instructions?: string;
  criteria: AssessmentCriteria;
  sections: ISection[];
  answerKey: IAnswerKeyItem[];
  fileUrl?: string;
  pdfUrl?: string;
  status: AssessmentStatus;
  error?: string;
}

// ─── Settings Types ──────────────────────────────────────────────

export interface ISettingsBase {
  schoolName: string;
  schoolAddress: string;
  teacherName: string;
}
