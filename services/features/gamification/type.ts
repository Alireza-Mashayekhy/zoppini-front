export interface StyleProfile {
  key: string;
  slug: string;
  titleEn: string;
  titleFa: string;
  descriptions: string[];
}

export interface GamificationResponse {
  id: number;
  fullName: string;
  phone: string;
  birthDate?: string;
  answers?: {
    questionNumber: number;
    optionNumber: number;
  }[];
  styleProfile?: StyleProfile | null;
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
  styleProfiles?: (StyleProfile & { count: number; percentage: number })[];
  totalParticipations: number;
  totalAnswers: number;
  totalQuestions: number;
}
