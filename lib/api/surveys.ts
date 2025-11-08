import apiClient from "./client";
import { Survey } from "@/types";

export const surveysApi = {
  getAll: () => apiClient.get("/surveys"),
  getOne: (id: string) => apiClient.get(`/surveys/${id}`),
  getPublic: (id: string) => apiClient.get(`/surveys/${id}/public`),
  create: (data: Partial<Survey>) => apiClient.post("/surveys", data),
  update: (id: string, data: Partial<Survey>) => apiClient.patch(`/surveys/${id}`, data),
  delete: (id: string) => apiClient.delete(`/surveys/${id}`),
};
