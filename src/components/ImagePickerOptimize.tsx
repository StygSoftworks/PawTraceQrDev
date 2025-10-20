import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, ImageIcon } from "lucide-react";

type OptimizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preferWebP?: boolean;
};

export type OptimizedImage = {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  approxKB: number;
  mimeType: string;
  original: {
    name: string;
    sizeKB: number;
    type: string;
  };
};

type Props = {
  label?: string;
  value?: OptimizedImage | null;
  onChange: (img: OptimizedImage | null) => void;
  options?: OptimizeOptions;
  accept?: string;
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
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pickFile = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clear = React.useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  const handleFile = React.useCallback(
    async (file: File) => {
      if (!file || !file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setError(null);
      setIsOptimizing(true);

      try {
        const result = await optimizeImageFile(file, options);
        onChange(result);
      } catch (err) {
        setError("Failed to optimize image. Please try another file.");
        console.error("Image optimization error:", err);
      } finally {
        setIsOptimizing(false);
      }
    },
    [options, onChange]
  );

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const compressionRate = value
    ? Math.round((1 - value.approxKB / value.original.sizeKB) * 100)
    : 0;

  return (
    <div className={className}>
      <Label className="mb-2 block font-medium">{label}</Label>

      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={pickFile}
          className={`
            relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer
            hover:border-primary/50 hover:bg-accent/50
            ${isDragging ? "border-primary bg-accent scale-[1.02]" : "border-border"}
            ${isOptimizing ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="text-sm font-medium">Optimizing image...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">
                    Drop your image here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-4">
            <div className="relative group">
              <img
                src={value.dataUrl}
                alt="preview"
                className="h-32 w-32 rounded-lg object-cover border-2 border-border"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm truncate">
                    {value.original.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {value.width} × {value.height}px
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Original</p>
                  <p className="font-medium">
                    {value.original.sizeKB.toLocaleString()} KB
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Optimized</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {value.approxKB.toLocaleString()} KB
                  </p>
                </div>
              </div>

              {compressionRate > 0 && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md px-3 py-2">
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                    ↓ {compressionRate}% smaller · {value.mimeType}
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={pickFile}
                className="w-full"
              >
                Replace Image
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------ Utilities ------------------------ */

async function optimizeImageFile(
  file: File,
  opts?: OptimizeOptions
): Promise<OptimizedImage> {
  const arrayBuf = await file.arrayBuffer();
  const blob = new Blob([arrayBuf]);
  const img = await blobToImage(blob);

  const maxW = opts?.maxWidth ?? 1200;
  const maxH = opts?.maxHeight ?? 1200;
  const { width, height } = fitWithin(img.width, img.height, maxW, maxH);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true })!;
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const preferWebP = opts?.preferWebP ?? true;
  const quality = opts?.quality ?? 0.82;

  const webpSupported = canvas
    .toDataURL("image/webp")
    .startsWith("data:image/webp");
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
      type: file.type,
    },
  };
}

function fitWithin(w: number, h: number, maxW: number, maxH: number) {
  const ratio = Math.min(maxW / w, maxH / h, 1);
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
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas to blob conversion failed"));
      },
      type,
      quality
    );
  });
}

function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Failed to read blob"));
    r.readAsDataURL(b);
  });
}

/* ------------------------ Demo ------------------------ */

export default function Demo() {
  const [image, setImage] = React.useState<OptimizedImage | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Image Optimizer</h1>
            <p className="text-sm text-muted-foreground">
              Upload and automatically optimize your images with WebP conversion
            </p>
          </div>

          <ImagePickerOptimize
            label="Product Image"
            value={image}
            onChange={setImage}
            options={{
              maxWidth: 1200,
              maxHeight: 1200,
              quality: 0.85,
              preferWebP: true,
            }}
          />

          {image && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Ready to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Use <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">image.blob</code> with FormData to send to your backend
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}