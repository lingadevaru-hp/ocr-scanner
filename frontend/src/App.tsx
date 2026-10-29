import { useState } from "react";
import { motion } from "framer-motion";
import {
  ScanText,
  Sparkles,
  FileImage,
  LoaderCircle,
} from "lucide-react";

import { UploadZone } from "./components/UploadZone";
import { FormatSelector } from "./components/FormatSelector";
import { ResultPreview } from "./components/ResultPreview";
import { DownloadButtons } from "./components/DownloadButtons";

import { scanImage, getErrorMessage } from "./api/scanApi";
import type { OutputFormat, ScanResult } from "./types";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(["txt"]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    setResult(null);
    setError(null);
  }

  async function handleScan() {
    if (!selectedFile || formats.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const scanResult = await scanImage({
        file: selectedFile,
        formats,
        language: "eng",
        preprocess: true,
      });

      setResult(scanResult);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  }

  const canScan =
    Boolean(selectedFile) &&
    formats.length > 0 &&
    !isProcessing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,#60a5fa,transparent_40%),radial-gradient(circle_at_bottom_right,#8b5cf6,transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-10">

        {/* Header */}

        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md border border-white/40 px-5 py-2 shadow-lg dark:bg-slate-800/60">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">
              AI OCR Document Scanner
            </span>
          </div>

          <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Extract Text from Images
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Upload scanned documents, receipts, books or images and export
            recognized text, searchable PDF and hOCR files.
          </p>
        </motion.div>

        {/* Dashboard */}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* LEFT */}

          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl border border-white/30 bg-white/60 backdrop-blur-xl shadow-2xl p-8 dark:bg-slate-900/60"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3 dark:bg-slate-800">
                <FileImage className="text-indigo-600" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  Upload Document
                </h2>

                <p className="text-sm text-slate-500">
                  JPG, PNG or scanned PDF
                </p>
              </div>
            </div>

            <UploadZone
              selectedFile={selectedFile}
              isProcessing={isProcessing}
              onFileSelect={handleFileSelect}
            />

            <div className="mt-8">
              <FormatSelector
                selected={formats}
                disabled={isProcessing}
                onChange={setFormats}
              />
            </div>

            <button
              disabled={!canScan}
              onClick={handleScan}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-xl transition hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ScanText />
                  Scan Document
                </>
              )}
            </button>

            {isProcessing && (
              <div className="mt-6">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </div>

                <p className="mt-2 text-center text-sm text-slate-500">
                  OCR Engine is recognizing text...
                </p>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}
          </motion.div>

          {/* RIGHT */}

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl border border-white/30 bg-white/60 backdrop-blur-xl shadow-2xl p-8 dark:bg-slate-900/60"
          >
            <h2 className="mb-6 text-xl font-semibold">
              OCR Results
            </h2>

            {!result && (
              <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-center">
                <div>
                  <ScanText
                    size={60}
                    className="mx-auto text-slate-400"
                  />

                  <h3 className="mt-4 text-lg font-medium">
                    No Results Yet
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Upload an image and start scanning.
                  </p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <ResultPreview result={result} />
                <DownloadButtons result={result} />
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}