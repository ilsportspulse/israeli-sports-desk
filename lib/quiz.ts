import quizJson from "@/data/daily-quiz.json";

export type DailyQuiz = {
  date: string;
  title: string;
  dek: string;
  questions: {
    question: string;
    answers: string[];
    correctIndex: number;
    explanation: string;
    sourceUrl: string;
  }[];
};

export function getDailyQuiz() {
  return quizJson as DailyQuiz;
}
