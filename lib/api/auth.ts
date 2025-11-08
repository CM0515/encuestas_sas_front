import apiClient from "./client";

export const authApi = {
  login: (idToken: string) => apiClient.post("/auth/login", { idToken }),
  getProfile: () => apiClient.get("/auth/profile"),
  getMe: () => apiClient.get("/auth/me"),
};
