import { useState, useEffect } from "react";
import { getMediaUrl } from "@/lib/api";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ImageUploadWithPreviewProps {
  /** Current image URL/path (for existing preview). */
  value?: string | null;
  /** Called when file is selected (file, undefined) or when upload completes (null, url). */
  onChange: (file: File | null, uploadedUrl?: string) => void;
  /** If provided, component will call on file select and then onChange(null, url). */
  onUpload?: (file: File) => Promise<string>;
  accept?: string;
  label?: string;
  disabled?: boolean;
  previewClassName?: string;
  showClear?: boolean;
}

export function ImageUploadWithPreview({
  value,
  onChange,
  onUpload,
  accept = "image/*,.png,.jpg,.jpeg,.webp,.gif",
  label = "Image",
  disabled = false,
  previewClassName = "h-16 w-16 object-contain border rounded bg-muted/30",
  showClear = true,
}: ImageUploadWithPreviewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const displayPreview = previewUrl ?? (value?.trim() ? (value.trim().startsWith("http") ? value.trim() : getMediaUrl(value.trim())) : null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) {
      setFile(null);
      onChange(null);
      return;
    }
    if (onUpload) {
      setUploading(true);
      try {
        const url = await onUpload(f);
        setFile(null);
        onChange(null, url);
      } catch {
        setFile(f);
        onChange(f, undefined);
      } finally {
        setUploading(false);
      }
    } else {
      setFile(f);
      onChange(f, undefined);
    }
  };

  const handleClear = () => {
    setFile(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs text-muted-foreground block">{label}</label>}
      <div className="flex items-center gap-3 flex-wrap">
        {displayPreview && (
          <div className="relative inline-block">
            <img src={displayPreview} alt="" className={previewClassName} />
            {showClear && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive"
                onClick={handleClear}
                aria-label="Clear"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <input
            type="file"
            accept={accept}
            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-muted file:text-xs"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
          {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
        </div>
      </div>
    </div>
  );
}
