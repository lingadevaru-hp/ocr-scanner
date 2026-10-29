export type OutputFormat = "txt" | "hocr" | "pdf";

export interface ScanResult {
  filename: string;

  text: string | null;
  hocr: string | null;
  pdf_base64: string | null;

  confidence: number | null;

  detected_language: string | null;

  duration_ms: number;

  page_count: number;
}