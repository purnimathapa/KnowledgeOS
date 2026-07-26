export type Subject = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type DocumentStatus =
  | "pending"
  | "processing"
  | "ready"
  | "error"
  | "failed"
  | (string & {});

export type Document = {
  id: string;
  subject_id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  status: DocumentStatus;
  extracted_text?: string | null;
  created_at: string;
};

export type Summary = {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type QaExchange = {
  id: string;
  document_id: string;
  user_id: string;
  question: string;
  answer: string;
  created_at: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export type Quiz = {
  id: string;
  document_id: string;
  user_id: string;
  questions: QuizQuestion[];
  created_at: string;
};

export type FlashcardPair = {
  front: string;
  back: string;
};

export type Flashcard = FlashcardPair & {
  id: string;
  document_id: string;
  user_id: string;
  sort_order?: number;
  created_at: string;
};

export const DOCUMENTS_BUCKET = "documents";
