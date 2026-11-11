"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import clsx from "clsx";
import { uploadImage } from "@/lib/admin/actions";

export type UploadedImage = { path: string; width: number; height: number };

/** Resize in the browser (max side) and encode as WebP before upload. */
async function toWebp(file: File, maxSide = 1600): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const width = Math.round(bmp.width * scale);
  const height = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, width, height);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Encode failed"))), "image/webp", 0.85));
  return { blob, width, height };
}

function useUploader(folder: string, name: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File): Promise<UploadedImage | null> => {
    setBusy(true);
    setError(null);
    try {
      const { blob, width, height } = await toWebp(file);
      const fd = new FormData();
      fd.set("file", new File([blob], "image.webp", { type: "image/webp" }));
      fd.set("folder", folder);
      fd.set("name", name || "image");
      const res = await uploadImage(fd);
      if (!res.ok || !res.path) throw new Error(res.ok ? "Upload failed" : res.error);
      return { path: res.path, width, height };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, upload };
}

function PickButton({ busy, onFiles, multiple, label = "Upload image" }: { busy: boolean; onFiles: (f: File[]) => void; multiple?: boolean; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-cream text-sm text-muted transition hover:border-ink/30 hover:text-ink disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        <span>{busy ? "Uploading…" : label}</span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </>
  );
}

/** Gallery of images; the first one is the main image. */
export function ImageGallery({ value, onChange, folder, name, mediaBase }: { value: UploadedImage[]; onChange: (v: UploadedImage[]) => void; folder: string; name: string; mediaBase: string }) {
  const { busy, error, upload } = useUploader(folder, name);
  const add = async (files: File[]) => {
    const out: UploadedImage[] = [];
    for (const f of files) {
      const img = await upload(f);
      if (img) out.push(img);
    }
    if (out.length) onChange([...value, ...out]);
  };
  return (
    <div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {value.map((img, i) => (
          <li key={img.path} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${mediaBase}/${img.path}`} alt="" className="h-full w-full object-contain p-2" />
            {i === 0 ? (
              <span className="absolute left-1.5 top-1.5 rounded bg-ink px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">Main</span>
            ) : (
              <button
                type="button"
                onClick={() => onChange([img, ...value.filter((_, j) => j !== i)])}
                className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded bg-white/90 text-ink-soft opacity-0 transition group-hover:opacity-100"
                title="Make main image"
              >
                <Star className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded bg-white/90 text-brand opacity-0 transition group-hover:opacity-100"
              title="Remove"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        <li>
          <PickButton busy={busy} onFiles={add} multiple label="Add images" />
        </li>
      </ul>
      {error && <p className="mt-2 text-sm text-brand">{error}</p>}
      <p className="mt-2 text-xs text-muted">JPEG, PNG or WebP. Resized to max 1600px and converted to WebP automatically. Use real product photos.</p>
    </div>
  );
}

/** A single image (cover / logo). */
export function SingleImage({
  value,
  onChange,
  folder,
  name,
  mediaBase,
  contain,
}: {
  value: UploadedImage | null;
  onChange: (v: UploadedImage | null) => void;
  folder: string;
  name: string;
  mediaBase: string;
  contain?: boolean;
}) {
  const { busy, error, upload } = useUploader(folder, name);
  return (
    <div className="max-w-xs">
      {value ? (
        <div className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${mediaBase}/${value.path}`} alt="" className={clsx("h-full w-full", contain ? "object-contain p-3" : "object-cover")} />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded bg-white/90 text-brand"
            title="Remove"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <PickButton busy={busy} onFiles={async (f) => onChange(await upload(f[0]))} />
      )}
      {error && <p className="mt-2 text-sm text-brand">{error}</p>}
    </div>
  );
}
