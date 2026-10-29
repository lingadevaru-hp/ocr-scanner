import type { ScanResult } from "../types";
import {
  Download,
  FileText,
  FileSearch,
  FileCheck2,
  CheckCircle2,
} from "lucide-react";

interface DownloadButtonsProps {
  result: ScanResult;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer.slice(0);
}

export function DownloadButtons({ result }: DownloadButtonsProps) {
  const baseName = result.filename.replace(/\.[^/.]+$/, "") || "scan";

  const downloads: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    onClick: () => void;
  }[] = [];

  if (result.text !== null) {
    downloads.push({
      title: "TXT",
      subtitle: "Plain Text",
      icon: FileText,
      color: "text-sky-600",
      bg: "bg-sky-100",
      onClick: () => {
        downloadBlob(
          new Blob([result.text ?? ""], {
            type: "text/plain;charset=utf-8",
          }),
          `${baseName}.txt`
        );
      },
    });
  }

  if (result.hocr !== null) {
    downloads.push({
      title: "hOCR",
      subtitle: "Layout Data",
      icon: FileSearch,
      color: "text-amber-600",
      bg: "bg-amber-100",
      onClick: () => {
        downloadBlob(
          new Blob([result.hocr ?? ""], {
            type: "application/xhtml+xml",
          }),
          `${baseName}.hocr`
        );
      },
    });
  }

  if (result.pdf_base64 !== null) {
    downloads.push({
      title: "PDF",
      subtitle: "Searchable PDF",
      icon: FileCheck2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      onClick: () => {
        const buffer = base64ToArrayBuffer(result.pdf_base64!);

        const pdfBlob = new Blob([buffer], {
          type: "application/pdf",
        });

        downloadBlob(pdfBlob, `${baseName}.pdf`);
      },
    });
  }

  if (downloads.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Download Results
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Save your OCR output in one or more formats.
          </p>
        </div>

        <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mr-1 inline" size={16} />
          Ready
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {downloads.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              onClick={item.onClick}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg}`}
                >
                  <Icon size={28} className={item.color} />
                </div>

                <Download
                  size={22}
                  className="text-slate-400 transition group-hover:text-blue-600"
                />
              </div>

              <h4 className="mt-6 text-xl font-semibold text-slate-900">
                {item.title}
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                {item.subtitle}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">
                  Download
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                  {item.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}