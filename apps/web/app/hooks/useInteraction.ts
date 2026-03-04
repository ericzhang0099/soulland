'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDragAndDropOptions {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const { onDragStart, onDragEnd, onDrop, accept, multiple = false } = options;
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = dropRef.current;
    if (!element) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      onDragStart?.();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      onDragEnd?.();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      onDragEnd?.();

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        onDrop?.(files);
      }
    };

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop);
    };
  }, [onDragStart, onDragEnd, onDrop]);

  return { isDragging, dropRef };
}

// 文件上传Hook
interface UseFileUploadOptions {
  maxSize?: number; // bytes
  accept?: string;
  multiple?: boolean;
  onUpload?: (files: File[]) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxSize = 10 * 1024 * 1024, accept, multiple = false, onUpload } = options;
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null = {
    if (maxSize && file.size > maxSize) {
      return `文件 ${file.name} 超过大小限制 (${(maxSize / 1024 / 1024).toFixed(1)}MB)`;
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type;
      });
      if (!isAccepted) {
        return `文件 ${file.name} 格式不支持`;
      }
    }
    return null;
  };

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const newFiles: File[] = [];
      const newErrors: string[] = [];

      Array.from(fileList).forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          newFiles.push(file);
        }
      });

      if (!multiple && newFiles.length > 0) {
        setFiles([newFiles[0]]);
        onUpload?.([newFiles[0]]);
      } else {
        setFiles((prev) => [...prev, ...newFiles]);
        onUpload?.(newFiles);
      }

      setErrors(newErrors);
    },
    [maxSize, accept, multiple, onUpload]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setErrors([]);
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    files,
    errors,
    inputRef,
    handleFiles,
    removeFile,
    clearFiles,
    openFileDialog,
  };
}

// 图片预览Hook
export function useImagePreview(file?: File) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    return () => {
      reader.abort();
    };
  }, [file]);

  return preview;
}

// 复制到剪贴板Hook
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setCopied(false);
      return false;
    }
  }, []);

  return { copy, copied };
}

// 分享Hook
export function useShare() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(!!navigator.share);
  }, []);

  const share = useCallback(
    async (data: { title?: string; text?: string; url?: string }) => {
      if (!navigator.share) {
        // 降级到复制链接
        if (data.url) {
          await navigator.clipboard.writeText(data.url);
        }
        return false;
      }

      try {
        await navigator.share(data);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  return { share, isSupported };
}
