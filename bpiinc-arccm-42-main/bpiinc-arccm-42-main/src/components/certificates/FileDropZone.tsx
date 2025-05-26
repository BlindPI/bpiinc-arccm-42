import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// GRADIENT FOR BRAND
const BRAND_GRADIENT = "bg-[linear-gradient(90deg,_#3B82F6_0%,_#8B5CF6_100%)]";
const BRAND_BORDER_GRADIENT =
  "border-transparent bg-[linear-gradient(#fff,_#fff),_linear-gradient(90deg,_#3B82F6_0%,_#8B5CF6_100%)] bg-origin-border bg-clip-content border-[3px]";

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
  accept = ".xlsx"
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

  // Animation for gradient glow if uploading/dragActive
  const isGlow = dragActive || isUploading;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[150px] text-center transition-colors duration-200 border-2 border-dashed rounded-xl cursor-pointer select-none animate-fade-in overflow-hidden",
        // Shimmer gradient border when active or uploading
        isGlow
          ? "border-[3px] border-transparent " +
            "bg-[linear-gradient(#fff,_#fff),_linear-gradient(90deg,#3B82F6, #8B5CF6)] bg-origin-border bg-clip-padding border-[3px] shadow-lg"
          : "border-muted bg-muted/40",
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "hover:border-primary/60"
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
      style={
        isGlow
          ? {
              boxShadow:
                "0 0 0 3px rgba(59,130,246,0.4), 0 2px 10px 0 rgba(139,92,246,0.13)",
            }
          : undefined
      }
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
          "mb-2 mx-auto transition-transform duration-300",
          isGlow ? "text-primary scale-110 animate-pulse" : "text-gray-400"
        )}
        size={32}
        aria-hidden="true"
      />
      <span className={cn("font-semibold text-base transition-colors",
        isGlow
          ? "bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
          : "text-gray-700 dark:text-gray-300"
      )}>
        {isUploading
          ? "Uploading and processing roster..."
          : dragActive
            ? "Drop file to upload"
            : "Drag & drop XLSX file or click to browse"}
      </span>
      <span className="block mt-1 text-xs text-muted-foreground">
        (Accepts .xlsx)
      </span>
      {/* Animated line gradient underline */}
      {isGlow && (
        <span aria-hidden className="absolute -bottom-[3px] left-0 w-full h-[3px] bg-gradient-to-r from-primary to-purple-500 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
