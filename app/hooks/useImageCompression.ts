import { useCallback } from "react";

export type CompressionOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png";
};

export function useImageCompression() {
  const compressImage = useCallback(async (
    file: File,
    options: CompressionOptions = {}
  ): Promise<File> => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = "jpeg"
    } = options;

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const compressImages = useCallback(async (
    files: File[],
    options?: CompressionOptions
  ): Promise<File[]> => {
    const compressed = await Promise.all(
      files.map(file => {
        if (file.type.startsWith("image/")) {
          return compressImage(file, options);
        }
        return Promise.resolve(file);
      })
    );
    return compressed;
  }, [compressImage]);

  return { compressImage, compressImages };
}
