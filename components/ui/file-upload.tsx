"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText, Paperclip } from "lucide-react";
import Image from "next/image";

export interface UploadedFile {
  url: string;
  name: string;
  type: "image" | "document";
  extractedContent?: string;
}

interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void;
  onFileRemove: (fileUrl: string) => void;
  uploadedFiles: UploadedFile[];
  disabled?: boolean;
}

const SUPPORTED_FILE_TYPES = {
  images: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ],
};

const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_FILE_TYPES.images,
  ...SUPPORTED_FILE_TYPES.documents,
];

export function FileUpload({
  onFileUpload,
  onFileRemove,
  uploadedFiles,
  disabled = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log("=== File Upload Debug ===");
    console.log("Files selected:", files.length);

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        console.log("Processing file:", {
          name: file.name,
          type: file.type,
          size: file.size,
        });

        // Validate file type
        if (!ALL_SUPPORTED_TYPES.includes(file.type)) {
          console.error("Unsupported file type:", file.type);
          console.log("Supported types:", ALL_SUPPORTED_TYPES);
          alert(
            `Unsupported file type: ${file.type}. Please select images (PNG, JPG, GIF, WebP) or documents (PDF, DOCX, TXT, MD)`
          );
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.error("File too large:", file.size);
          alert("File size must be less than 10MB");
          continue;
        }

        console.log("File validation passed, uploading...");
        const formData = new FormData();
        formData.append("file", file);

        console.log("Making request to /api/upload-file");
        const response = await fetch("/api/upload-file", {
          method: "POST",
          body: formData,
        });

        console.log("Upload response:", {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Upload successful:", result);
          onFileUpload({
            url: result.url,
            name: result.fileName || file.name,
            type: SUPPORTED_FILE_TYPES.images.includes(file.type)
              ? "image"
              : "document",
            extractedContent: result.extractedContent,
          });
        } else {
          const errorText = await response.text();
          console.error("Upload failed:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          alert("Upload failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const renderFilePreview = (file: UploadedFile, index: number) => {
    if (file.type === "image") {
      return (
        <div key={index} className="relative group">
          <Image
            src={file.url}
            alt={`Uploaded image ${index + 1}`}
            width={80}
            height={80}
            className="rounded-lg object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFileRemove(file.url)}
            className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    } else {
      return (
        <div
          key={index}
          className="relative group flex items-center gap-2 p-2 bg-neutral-700/50 rounded-lg border border-neutral-600"
        >
          <FileText className="h-6 w-6 text-neutral-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{file.name}</p>
            {file.extractedContent && (
              <p className="text-xs text-neutral-400 truncate">
                {file.extractedContent.slice(0, 50)}...
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFileRemove(file.url)}
            className="h-6 w-6 p-0 text-neutral-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-2">
      {/* Upload Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={triggerFileSelect}
        disabled={disabled || isUploading}
        className="h-8 w-8 p-0 hover:bg-neutral-700/50"
        title="Upload files (Images, PDF, DOCX, TXT)"
      >
        {isUploading ? (
          <Upload className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_SUPPORTED_TYPES.join(",")}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-neutral-800/50 rounded-lg">
          {uploadedFiles.map((file, index) => renderFilePreview(file, index))}
        </div>
      )}
    </div>
  );
}
