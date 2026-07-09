export interface Topic {
  title: string;
  description: string;
}

export interface Article {
  pageid: number;
  title: string;
  extract: string;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  factSource: string;
}

export interface QuizConfig {
  count: number;
  difficulty: "Easy" | "Medium" | "Hard";
  quizType: "Multiple Choice" | "True or False";
}

export interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}
