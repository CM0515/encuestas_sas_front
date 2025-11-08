import apiClient from "./client";

export const responsesApi = {
  submit: (data: any) => apiClient.post("/responses", data),
  getBySurvey: (surveyId: string) => apiClient.get(`/responses/survey/${surveyId}`),
};
