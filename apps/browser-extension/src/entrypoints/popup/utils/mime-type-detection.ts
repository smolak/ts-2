const mimeTypes = {
  image: new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/apng",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/tiff",
    "image/svg+xml",
    "image/heif",
    "image/heic",
    "image/jp2",
    "image/jxr",
    "image/cgm",
    "image/dicom-rle",
    "image/emf",
    "image/wmf",
    "image/avif"
  ]),
  text: new Set(["text/plain", "text/css", "text/javascript", "text/markdown", "text/xml"]),
  application: new Set([
    "application/json",
    "application/xml",
    "application/pdf",
    "application/zip",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/octet-stream"
  ]),
  audio: new Set(["audio/mpeg", "audio/ogg", "audio/wav", "audio/aac", "audio/webm"]),
  video: new Set(["video/mp4", "video/ogg", "video/webm", "video/quicktime"])
}

export const isMimeType = (mimeType: string, type: keyof typeof mimeTypes): boolean =>
  mimeTypes[type].has(mimeType)

export const isImage = (mimeType: string) => isMimeType(mimeType, "image")
export const isText = (mimeType: string) => isMimeType(mimeType, "text")
export const isApplication = (mimeType: string) => isMimeType(mimeType, "application")
export const isAudio = (mimeType: string) => isMimeType(mimeType, "audio")
export const isVideo = (mimeType: string) => isMimeType(mimeType, "video")

export const isHtml = (mimeType: string) => mimeType === "text/html"
