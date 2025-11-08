import apiClient from "./client";
import { Question } from "@/types";

export const questionsApi = {
  getBySurvey: (surveyId: string) => apiClient.get(`/questions/survey/${surveyId}`),
  create: (data: Partial<Question>) => apiClient.post("/questions", data),
  update: (id: string, data: Partial<Question>) => apiClient.patch(`/questions/${id}`, data),
  delete: (id: string) => apiClient.delete(`/questions/${id}`),
};
