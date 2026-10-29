import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  ImagePlus,
  FileImage,
  Sparkles,
  LoaderCircle,
} from "lucide-react";

interface UploadZoneProps {
  selectedFile: File | null;
  isProcessing: boolean;
  onFileSelect: (file: File) => void;
}

export function UploadZone({
  selectedFile,
  isProcessing,
  onFileSelect,
}: UploadZoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isProcessing,
    accept: {
      "image/*": [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".bmp",
        ".tiff",
      ],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`
        group relative overflow-hidden rounded-3xl
        border-2 border-dashed
        bg-white
        transition-all duration-300
        cursor-pointer

        ${
          isDragActive
            ? "border-blue-500 shadow-2xl shadow-blue-100 scale-[1.01]"
            : "border-slate-300 hover:border-blue-500 hover:shadow-xl"
        }

        ${
          isProcessing
            ? "pointer-events-none opacity-90"
            : ""
        }
      `}
    >
      <input {...getInputProps()} />

      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 opacity-70" />

      {/* Decorative Blur */}
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-indigo-200/20 blur-3xl" />

      <div className="relative z-10 p-8 lg:p-10">
        {previewUrl ? (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto max-h-[430px] w-auto object-contain transition duration-500 group-hover:scale-[1.02]"
              />

              {isProcessing && (
                <>
                  <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <LoaderCircle
                      size={42}
                      className="animate-spin"
                    />

                    <p className="mt-4 text-lg font-semibold">
                      Processing Document...
                    </p>

                    <p className="mt-1 text-sm text-blue-100">
                      OCR engine is extracting text
                    </p>
                  </div>

                  <div className="scan-line" />
                </>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <FileImage className="text-blue-600" size={22} />

                <div>
                  <p className="font-semibold text-slate-800">
                    {selectedFile?.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {selectedFile &&
                      (selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                    MB
                  </p>
                </div>
              </div>

              {!isProcessing && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Ready
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 lg:py-20">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl">
              {isDragActive ? (
                <ImagePlus size={42} />
              ) : (
                <UploadCloud size={42} />
              )}
            </div>

            <h2 className="mt-8 text-3xl font-bold tracking-tight text-slate-900">
              Upload your document
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-slate-500 leading-relaxed">
              Drag & drop your image or PDF here, or click anywhere to browse
              your computer.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                PNG
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                JPG
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                WEBP
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                BMP
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                TIFF
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                PDF
              </span>
            </div>

            <div className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg">
              <Sparkles size={18} />
              Click to Select File
            </div>
          </div>
        )}
      </div>
    </div>
  );
}