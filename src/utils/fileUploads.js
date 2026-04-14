export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];
export const ALLOWED_DOCUMENT_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, "application/pdf"];

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const getDataUrlMimeType = (value = "") => {
  if (typeof value !== "string") return "";
  const match = value.match(/^data:([^;]+);base64,/i);
  return match ? match[1].toLowerCase() : "";
};

export const isPdfDataUrl = (value = "") => getDataUrlMimeType(value) === "application/pdf";

export const validateFileType = (file, allowedMimeTypes) => {
  const mimeType = (file?.type || "").toLowerCase();
  if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      message: `Only ${allowedMimeTypes.join(", ")} files are allowed.`
    };
  }

  return { valid: true, mimeType };
};
