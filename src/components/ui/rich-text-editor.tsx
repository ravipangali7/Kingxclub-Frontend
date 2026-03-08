import { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold", "italic", "underline", "strike",
  "list", "bullet",
  "color", "background",
  "link",
];

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write content...",
  className,
  minHeight = "120px",
}: RichTextEditorProps) {
  const editorClass = useMemo(
    () => cn("rich-text-editor [&_.ql-editor]:min-h-[var(--min-height)]", className),
    [className]
  );

  return (
    <div className={editorClass} style={{ ["--min-height" as string]: minHeight }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="rounded-md border border-input bg-background"
      />
    </div>
  );
}
