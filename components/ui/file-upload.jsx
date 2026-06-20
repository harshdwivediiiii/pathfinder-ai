"use client";

import { useState, useRef } from "react";
import { UploadCloud, File as FileIcon, X, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";

export function FileUpload({ onFileSelect, isExtracting, extractionProgress, success, onClear }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndProcessFile = (selectedFile) => {
    setError(null);
    
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload a PDF, JPG, or PNG.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    if (onFileSelect) {
      onFileSelect(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isExtracting || success) return;
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndProcessFile(droppedFile);
  };

  const handleFileChange = (e) => {
    if (isExtracting || success) return;
    
    const selectedFile = e.target.files[0];
    validateAndProcessFile(selectedFile);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onClear) onClear();
  };

  return (
    <div className="w-full space-y-4">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ease-in-out text-center ${
              isDragging 
                ? "border-red-500 bg-red-500/5 scale-[1.02]" 
                : error 
                  ? "border-destructive bg-destructive/5" 
                  : "border-border hover:border-red-500/50 hover:bg-muted/50 cursor-pointer"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isExtracting && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              disabled={isExtracting}
            />
            
            <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
              <div className={`p-4 rounded-full ${isDragging ? 'bg-red-500/20 text-red-500' : 'bg-muted text-muted-foreground'}`}>
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, or PNG (max. 10MB)
                </p>
              </div>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 px-3 py-1.5 rounded-full"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative border rounded-2xl p-5 ${
              success ? "border-green-500/30 bg-green-500/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`p-3 rounded-xl shrink-0 ${
                  file.type === "application/pdf" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                }`}>
                  {file.type === "application/pdf" ? <FileIcon className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate max-w-[200px] md:max-w-[300px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              {!isExtracting && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClear}
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {isExtracting && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-primary">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {extractionProgress || "Extracting text..."}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 15, ease: "linear" }} // Faux progress for visual feedback
                  />
                </div>
              </div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-500 bg-green-500/10 px-3 py-2 rounded-lg"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Successfully extracted text. Review the content below.
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
