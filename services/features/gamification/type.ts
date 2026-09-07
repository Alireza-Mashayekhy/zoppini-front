export interface GamificationResponse {
  id: number;
  fullName: string;
  phone: string;
  birthDate?: string;
  answers?: {
    questionNumber: number;
    optionNumber: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GamificationDto {
  fullName: string;
  phone: string;
  birthDate: string;
  answers: { questionNumber: number; optionNumber: number }[];
}

export interface GamificationStats {
  questions: {
    questionNumber: number;
    totalAnswers: number;
    options: { optionNumber: number; count: number }[];
  }[];
  totalParticipations: number;
  totalAnswers: number;
  totalQuestions: number;
}
