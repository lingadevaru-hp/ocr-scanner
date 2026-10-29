import type { OutputFormat } from "../types";
import {
  FileText,
  FileSearch,
  FileCheck2,
  CheckCircle2,
} from "lucide-react";

interface FormatOption {
  value: OutputFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const OPTIONS: FormatOption[] = [
  {
    value: "txt",
    label: "Plain Text",
    description: "Extract readable text only",
    icon: FileText,
    color: "text-sky-600",
  },
  {
    value: "hocr",
    label: "hOCR",
    description: "Text with layout & coordinates",
    icon: FileSearch,
    color: "text-amber-600",
  },
  {
    value: "pdf",
    label: "Searchable PDF",
    description: "Create searchable PDF document",
    icon: FileCheck2,
    color: "text-emerald-600",
  },
];

interface FormatSelectorProps {
  selected: OutputFormat[];
  disabled: boolean;
  onChange: (formats: OutputFormat[]) => void;
}

export function FormatSelector({
  selected,
  disabled,
  onChange,
}: FormatSelectorProps) {
  function toggle(value: OutputFormat) {
    if (selected.includes(value)) {
      onChange(selected.filter((f) => f !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <fieldset disabled={disabled}>
      <legend className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Output Formats
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Choose one or more formats to generate after OCR processing.
        </p>
      </legend>

      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map((option) => {
          const checked = selected.includes(option.value);
          const Icon = option.icon;

          return (
            <label
              key={option.value}
              className={`
                group relative cursor-pointer overflow-hidden rounded-2xl border
                transition-all duration-300

                ${
                  checked
                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                }

                ${
                  disabled
                    ? "cursor-not-allowed opacity-60"
                    : ""
                }
              `}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={checked}
                onChange={() => toggle(option.value)}
              />

              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`
                      flex h-12 w-12 items-center justify-center rounded-xl
                      ${
                        checked
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100"
                      }
                    `}
                  >
                    <Icon
                      size={22}
                      className={!checked ? option.color : ""}
                    />
                  </div>

                  {checked && (
                    <CheckCircle2
                      size={22}
                      className="text-blue-600"
                    />
                  )}
                </div>

                <h4 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  {option.label}
                </h4>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {option.description}
                </p>
              </div>

              {checked && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}