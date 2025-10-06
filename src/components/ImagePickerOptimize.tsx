import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type OptimizeOptions = {
  maxWidth?: number;   // default 1200
  maxHeight?: number;  // default 1200
  quality?: number;    // 0..1, default 0.82
  preferWebP?: boolean; // default true
};

export type OptimizedImage = {
  blob: Blob;          // optimized image blob (send this to your backend)
  dataUrl: string;     // preview
  width: number;
  height: number;
  approxKB: number;    // size estimate
  mimeType: string;    // "image/webp" or "image/jpeg"
  original: {
    name: string;
    sizeKB: number;
    type: string;
  }
};

type Props = {
  label?: string;
  value?: OptimizedImage | null;
  onChange: (img: OptimizedImage | null) => void;
  options?: OptimizeOptions;
  accept?: string; // e.g. "image/*"
  className?: string;
};

export function ImagePickerOptimize({
  label = "Photo",
  value,
  onChange,
  options,
  accept = "image/*",
  className,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const pickFile = () => inputRef.current?.click();
  const clear = () => onChange(null);

  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const result = await optimizeImageFile(file, options);
    onChange(result);
  };

  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={pickFile}>
          {value ? "Replace Image" : "Upload Image"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" onClick={clear}>
            Remove
          </Button>
        )}
      </div>

      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // clear the input so selecting the same file again re-triggers change
          e.currentTarget.value = "";
        }}
      />

      {value && (
        <>
          <Separator className="my-3" />
          <div className="flex items-start gap-4">
            <img
              src={value.dataUrl}
              alt="preview"
              className="h-24 w-24 rounded-md object-cover border"
            />
            <div className="text-sm text-muted-foreground space-y-1">
              <div><span className="font-medium text-foreground">Optimized:</span> {value.mimeType}</div>
              <div>Size: ~{value.approxKB.toLocaleString()} KB</div>
              <div>Dims: {value.width} × {value.height}</div>
              <div className="mt-2">
                <span className="font-medium text-foreground">Original:</span>{" "}
                {value.original.name} — {value.original.sizeKB.toLocaleString()} KB
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------ Utilities ------------------------ */

async function optimizeImageFile(file: File, opts?: OptimizeOptions): Promise<OptimizedImage> {
  const arrayBuf = await file.arrayBuffer();
  const blob = new Blob([arrayBuf]);
  const img = await blobToImage(blob);

  // target dims
  const maxW = opts?.maxWidth ?? 1200;
  const maxH = opts?.maxHeight ?? 1200;
  const { width, height } = fitWithin(img.width, img.height, maxW, maxH);

  // draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  const preferWebP = opts?.preferWebP ?? true;
  const quality = opts?.quality ?? 0.82;

  const webpSupported = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  const mime = preferWebP && webpSupported ? "image/webp" : "image/jpeg";

  const outBlob = await canvasToBlob(canvas, mime, quality);
  const dataUrl = await blobToDataURL(outBlob);

  return {
    blob: outBlob,
    dataUrl,
    width,
    height,
    approxKB: Math.round(outBlob.size / 1024),
    mimeType: mime,
    original: {
      name: file.name,
      sizeKB: Math.round(file.size / 1024),
      type: file.type
    }
  };
}

function fitWithin(w: number, h: number, maxW: number, maxH: number) {
  const ratio = Math.min(maxW / w, maxH / h, 1); // never upscale
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), type, quality));
}

function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(b);
  });
}
