
import React, { useCallback, useState } from 'react';
import { Upload, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileDropZone({
  onFileSelected,
  disabled = false,
  isUploading = false,
  accept = ".xlsx,.csv",
  maxSize = 10
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const processFile = useCallback((file: File) => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size exceeds ${maxSize}MB limit.`);
      return;
    }
    
    onFileSelected(file);
  }, [maxSize, onFileSelected]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || isUploading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, [disabled, isUploading, processFile]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isUploading) return;
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  }, [disabled, isUploading, processFile]);
  
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-md flex flex-col items-center justify-center p-6 transition-colors",
        isDragging ? "border-primary bg-primary/10" : "border-gray-300 bg-gray-50/50 dark:bg-gray-800/30",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        "hover:border-primary hover:bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        if (!disabled && !isUploading) {
          document.getElementById("file-upload")?.click();
        }
      }}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleInputChange}
        accept={accept}
        disabled={disabled || isUploading}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center py-4 space-y-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium">Processing file...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 space-y-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Drag & Drop or Click to Upload</p>
            <p className="text-sm text-muted-foreground">
              XLSX or CSV files only (Max {maxSize}MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
