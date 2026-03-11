import { AxiosError } from "axios";

export const getErrorMessage = (error: unknown, defaultMessage: string = "An error occurred"): string => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};
