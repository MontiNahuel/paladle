/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from "react";

/**
 * Renders dynamic user/admin-provided images (Vercel Blob, local SVGs, or pasted URLs)
 * directly without consuming Vercel Image Optimization transformation quota.
 */
export function DynamicImage({
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  return <img alt={alt} {...props} />;
}
