import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (axios.isAxiosError(error)) {
      error.message =
        error.response?.data?.message ??
        `Request failed with status ${
          error.response?.status ?? "unknown"
        }`;
    }

    return Promise.reject(error);
  },
);