import axios from "axios";
import type { OutputFormat, ScanResult } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export interface ScanOptions {
  file: File;
  formats: OutputFormat[];
  language?: string;
  preprocess?: boolean;
}

export interface HealthResponse {
  status: string;
  version: string;
  supported_languages: Record<string, string>;
}

export async function scanImage({
  file,
  formats,
  language = "eng",
  preprocess = true,
}: ScanOptions): Promise<ScanResult> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("formats", formats.join(","));
  formData.append("lang", language);
  formData.append("preprocess", String(preprocess));

  const response = await axios.post<ScanResult>(
    `${API_BASE_URL}/api/scan`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2 minutes for large PDFs
    }
  );

  return response.data;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await axios.get<HealthResponse>(
    `${API_BASE_URL}/api/health`
  );
  return response.data;
}

export function getErrorMessage(error: unknown): string {
  console.error(error);

  if (axios.isAxiosError(error)) {
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);

    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (error.response) {
      return `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    }

    if (error.code === "ERR_NETWORK") {
      return "Cannot connect to backend.";
    }

    if (error.code === "ECONNABORTED") {
      return "Request timed out.";
    }
  }

  return String(error);
}