"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileType, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileDropzoneProps {
  files: File[];
  setFiles: (files: File[]) => void;
}

export default function FileDropzone({ files, setFiles }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  // Tracks the indices of files that have been clicked (and thus show the delete icon)
  const [activeFileIndices, setActiveFileIndices] = useState<number[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files)); // Handle multiple files
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files)); // Handle multiple files
    }
  };

  // Toggle active state on click
  const handleFileClick = (index: number) => {
    setActiveFileIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  // Delete file at the given index
  const handleFileDelete = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    // Remove the index from active indices if present
    setActiveFileIndices((prev) => prev.filter((i) => i !== index));
    toast.success("File removed");
  };

  return (
    <Card
      className={cn(
        "p-8 border-2 border-dashed transition-colors duration-200",
        isDragging
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
          : "border-gray-200 dark:border-gray-800",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900">
          <Upload className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Drop your .npz or .npy files here
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            or click to browse
          </p>
        </div>

        <Input
          type="file"
          onChange={handleFileChange}
          accept=".npy,.npz"
          className="hidden"
          id="file-upload"
          multiple
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900 dark:hover:bg-indigo-800"
        >
          Select Files
        </label>

        {files.length > 0 && (
          <div className="flex flex-col items-center space-y-2 text-sm text-gray-500 dark:text-gray-400">
            {files.map((file, index) => (
              <div key={index} className="flex items-center space-x-2">
                <FileType className="h-4 w-4" />
                <span
                  className="cursor-pointer"
                  onClick={() => handleFileClick(index)}
                >
                  {file.name}
                </span>
                {activeFileIndices.includes(index) && (
                  <button onClick={() => handleFileDelete(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
