"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { DynamicImage } from "@/components/ui/DynamicImage";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  folder: "avatars" | "themes" | "logos";
  placeholder?: string;
  allowClear?: boolean;
  onChange: (nextUrl: string) => void;
}

export function ImageUploadField({
  label,
  value,
  folder,
  placeholder = "https://... o /avatars/...",
  allowClear = false,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "No se pudo subir la imagen.");
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError("Error subiendo la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
        {label}
      </label>

      <div className="flex items-center gap-2.5">
        {value ? (
          <DynamicImage
            src={value}
            alt={label}
            className="h-11 w-11 shrink-0 rounded-[4px] border border-slate-700 bg-slate-950 object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border border-dashed border-slate-700 bg-slate-950/70 text-slate-500">
            <ImagePlus className="h-4 w-4" />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-1.5 sm:flex-row">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-amber-400"
          />

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[4px] border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Subiendo...
              </>
            ) : (
              <>
                <ImagePlus className="h-3.5 w-3.5" /> Subir
              </>
            )}
          </button>

          {allowClear && value && (
            <button
              type="button"
              onClick={() => onChange("")}
              title="Quitar imagen"
              className="inline-flex shrink-0 items-center justify-center rounded-[4px] border border-rose-500/40 bg-rose-500/10 px-2.5 py-2 text-rose-300 transition hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
    </div>
  );
}
