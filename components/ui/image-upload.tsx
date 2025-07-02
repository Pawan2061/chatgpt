"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Upload } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: (imageUrl: string) => void;
  uploadedImages: string[];
  disabled?: boolean;
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  uploadedImages,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert("Please select only image files");
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert("File size must be less than 10MB");
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          onImageUpload(result.url);
        } else {
          console.error("Upload failed");
          alert("Upload failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error uploading images. Please try again.");
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
      >
        {isUploading ? (
          <Upload className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-neutral-800/50 rounded-lg">
          {uploadedImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <Image
                src={imageUrl}
                alt={`Uploaded image ${index + 1}`}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onImageRemove(imageUrl)}
                className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
