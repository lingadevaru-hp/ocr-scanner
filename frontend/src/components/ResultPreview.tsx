import { useMemo, useState } from "react";
import type { ScanResult } from "../types";
import {
  Copy,
  Check,
  FileText,
  Languages,
  Timer,
  BadgeCheck,
} from "lucide-react";

interface ResultPreviewProps {
  result: ScanResult;
}

export function ResultPreview({ result }: ResultPreviewProps) {
  const [copied, setCopied] = useState(false);

  const text = result.text ?? "";
  const hasText = text.trim().length > 0;

  const stats = useMemo(() => {
    const words = text.trim()
      ? text.trim().split(/\s+/).length
      : 0;

    return {
      words,
      chars: text.length,
    };
  }, [text]);

  async function copyText() {
    if (!hasText) return;

    await navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}

      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2">
                <FileText
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  OCR Result
                </h2>

                <p className="text-sm text-slate-500">
                  {result.filename}
                </p>
              </div>
            </div>
          </div>

          {hasText && (
            <button
              onClick={copyText}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy Text
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats */}

        <div className="mt-5 grid gap-3 md:grid-cols-4">

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Words
            </div>

            <div className="mt-1 text-lg font-semibold text-slate-900">
              {stats.words}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Characters
            </div>

            <div className="mt-1 text-lg font-semibold text-slate-900">
              {stats.chars}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">

            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <Languages size={14} />
              Language
            </div>

            <div className="mt-1 text-lg font-semibold capitalize text-slate-900">
              {result.detected_language ?? "--"}
            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">

            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <Timer size={14} />
              Time
            </div>

            <div className="mt-1 text-lg font-semibold text-slate-900">
              {(result.duration_ms / 1000).toFixed(2)}s
            </div>

          </div>

        </div>

        {result.confidence !== null && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            <BadgeCheck size={16} />
            OCR Confidence {result.confidence}%
          </div>
        )}

      </div>

      {/* Text */}

      <div className="p-6">

        {hasText ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">

            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">

              <div className="flex gap-2">

                <span className="h-3 w-3 rounded-full bg-red-500" />

                <span className="h-3 w-3 rounded-full bg-yellow-500" />

                <span className="h-3 w-3 rounded-full bg-green-500" />

              </div>

              <span className="text-xs text-slate-400">
                OCR Preview
              </span>

            </div>

            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words p-6 font-mono text-[15px] leading-7 text-slate-200">
{text}
            </pre>

          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 py-20 text-center">

            <FileText
              size={52}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-6 text-xl font-semibold text-slate-700">
              No Preview Available
            </h3>

            <p className="mx-auto mt-3 max-w-md text-slate-500">
              {result.text === null
                ? "Text preview wasn't requested. Enable the Text output format before scanning."
                : "No readable text was detected in this document."}
            </p>

          </div>
        )}

      </div>

    </section>
  );
}