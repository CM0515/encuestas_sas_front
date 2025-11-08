import apiClient from "./client";

export const analyticsApi = {
  getResults: (surveyId: string) => apiClient.get(`/analytics/surveys/${surveyId}/results`),
  exportCSV: (surveyId: string) => apiClient.post(`/analytics/surveys/${surveyId}/export`),
};
