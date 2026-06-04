import { API_URL } from "../config";

export const mediaUrl = (src) => {
  if (!src) return "";

  const value = String(src);
  const uploadIndex = value.indexOf("/uploads/");

  if (value.startsWith("data:") || value.startsWith("blob:")) return value;

  if (uploadIndex !== -1) {
    return `${API_URL}${value.slice(uploadIndex)}`;
  }

  if (value.startsWith("http")) return value;
  if (value.startsWith("uploads/")) return `${API_URL}/${value}`;

  return `${API_URL}/uploads/${value.replace(/^\/+/, "")}`;
};
