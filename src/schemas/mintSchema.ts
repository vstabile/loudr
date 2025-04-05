import { z } from "zod";

export const mintSchema = z.string().url("Must be a valid URL");

// Helper function to clean URL for display
export const cleanUrlForDisplay = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.replace(/\/$/, "");
    return urlObj.host + path + urlObj.search;
  } catch {
    return url;
  }
};
