
import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  isUploading?: boolean;
}

export function FileDropZone({
  onFileSelected,
  disabled = false,
  isUploading = false,
  accept = ".csv,.xlsx"
}: FileDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
      e.dataTransfer.clearData();
    }
  }

  function handleClick() {
    if (!disabled && inputRef.current) {
      inputRef.current.value = ""; // allow re-selection of the same file.
      inputRef.current.click();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[150px] text-center transition-colors duration-150 border-2 border-dashed rounded-xl cursor-pointer",
        dragActive
          ? "border-primary bg-primary/10 dark:bg-primary/20"
          : "border-muted bg-muted/40",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/60",
      )}
      tabIndex={0}
      role="button"
      aria-disabled={disabled}
      aria-label="Upload Roster by Drag & Drop or Click"
      onClick={handleClick}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyPress={e => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) handleClick();
      }}
    >
      <input
        type="file"
        accept={accept}
        ref={inputRef}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
        tabIndex={-1}
        aria-label="Roster File Upload"
      />
      <Upload
        className={cn(
          "mb-2 mx-auto",
          dragActive ? "text-primary" : "text-gray-400"
        )}
        size={32}
        aria-hidden="true"
      />
      <span className={cn("font-semibold text-base",
        dragActive ? "text-primary" : "text-gray-700 dark:text-gray-300"
      )}>
        {isUploading
          ? "Uploading and processing roster..."
          : dragActive
            ? "Drop file to upload"
            : "Drag & drop CSV/XLSX file or click to browse"}
      </span>
      <span className="block mt-1 text-xs text-muted-foreground">
        (Accepts .csv, .xlsx)
      </span>
    </div>
  );
}
