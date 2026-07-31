import imageCompression from "browser-image-compression";

export async function compressToWebp(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1200,
    fileType: "image/webp",
    useWebWorker: true,
  });
}
