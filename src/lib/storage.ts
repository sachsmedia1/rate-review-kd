import { supabase } from "@/integrations/supabase/client";
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// Storage Provider Interface
export interface StorageProvider {
  upload(file: File, path: string): Promise<string>;
  getPublicUrl(path: string): string;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

// Supabase Storage Implementation
class SupabaseStorage implements StorageProvider {
  private bucketName = "review-images";

  async upload(file: File, path: string): Promise<string> {
    console.log(`[SupabaseStorage] Uploading file to: ${path}`);
    
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error("[SupabaseStorage] Upload error:", error);
      throw error;
    }

    console.log(`[SupabaseStorage] Upload successful: ${data.path}`);
    return this.getPublicUrl(data.path);
  }

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    
    console.log(`[SupabaseStorage] Public URL generated: ${data.publicUrl}`);
    return data.publicUrl;
  }

  async delete(path: string): Promise<void> {
    console.log(`[SupabaseStorage] Deleting file: ${path}`);
    
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      console.error("[SupabaseStorage] Delete error:", error);
      throw error;
    }

    console.log(`[SupabaseStorage] Delete successful: ${path}`);
  }

  async exists(path: string): Promise<boolean> {
    console.log(`[SupabaseStorage] Checking if file exists: ${path}`);
    
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .list(path.split("/").slice(0, -1).join("/"), {
        limit: 1,
        search: path.split("/").pop(),
      });

    const exists = !error && data && data.length > 0;
    console.log(`[SupabaseStorage] File exists: ${exists}`);
    return exists;
  }
}

// Cloudflare R2 Storage Implementation
class CloudflareR2Storage implements StorageProvider {
  private client: S3Client;
  private bucketName: string;
  private accountId: string;

  constructor() {
    this.accountId = import.meta.env.VITE_R2_ACCOUNT_ID || "";
    this.bucketName = import.meta.env.VITE_R2_BUCKET_NAME || "";
    
    console.log(`[CloudflareR2Storage] Initializing with account: ${this.accountId}, bucket: ${this.bucketName}`);

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || "",
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || "",
      },
    });
  }

  private guessContentType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      txt: "text/plain",
      json: "application/json",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }

  async upload(file: File, path: string): Promise<string> {
    console.log(`[CloudflareR2Storage] Uploading file to: ${path}`);
    
    const buffer = await file.arrayBuffer();
    const contentType = file.type || this.guessContentType(file.name);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: new Uint8Array(buffer),
      ContentType: contentType,
    });

    try {
      await this.client.send(command);
      console.log(`[CloudflareR2Storage] Upload successful: ${path}`);
      return this.getPublicUrl(path);
    } catch (error) {
      console.error("[CloudflareR2Storage] Upload error:", error);
      throw error;
    }
  }

  getPublicUrl(path: string): string {
    const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL || 
      `https://pub-${this.accountId}.r2.dev`;
    const url = `${publicUrl}/${path}`;
    console.log(`[CloudflareR2Storage] Public URL generated: ${url}`);
    return url;
  }

  async delete(path: string): Promise<void> {
    console.log(`[CloudflareR2Storage] Deleting file: ${path}`);
    
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: path,
    });

    try {
      await this.client.send(command);
      console.log(`[CloudflareR2Storage] Delete successful: ${path}`);
    } catch (error) {
      console.error("[CloudflareR2Storage] Delete error:", error);
      throw error;
    }
  }

  async exists(path: string): Promise<boolean> {
    console.log(`[CloudflareR2Storage] Checking if file exists: ${path}`);
    
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: path,
    });

    try {
      await this.client.send(command);
      console.log(`[CloudflareR2Storage] File exists: true`);
      return true;
    } catch (error) {
      console.log(`[CloudflareR2Storage] File exists: false`);
      return false;
    }
  }
}

// Factory Function
export function createStorageProvider(): StorageProvider {
  const provider = import.meta.env.VITE_STORAGE_PROVIDER || "supabase";
  console.log(`[Storage] Creating storage provider: ${provider}`);

  if (provider === "r2" || provider === "cloudflare") {
    return new CloudflareR2Storage();
  }
  
  return new SupabaseStorage();
}

// Single Storage Instance
export const storage = createStorageProvider();

// Helper Functions
export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_");
  
  const filename = prefix 
    ? `${prefix}/${baseName}_${timestamp}_${randomString}.${extension}`
    : `${baseName}_${timestamp}_${randomString}.${extension}`;
  
  console.log(`[Storage] Generated unique filename: ${filename}`);
  return filename;
}

export interface ValidateFileOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(file: File, options?: ValidateFileOptions): { valid: boolean; error?: string } {
  console.log(`[Storage] Validating file: ${file.name}, size: ${file.size}, type: ${file.type}`);
  
  const maxSizeMB = options?.maxSizeMB || 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    const error = `File size exceeds ${maxSizeMB}MB limit`;
    console.error(`[Storage] Validation failed: ${error}`);
    return { valid: false, error };
  }

  if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
    const error = `File type ${file.type} not allowed`;
    console.error(`[Storage] Validation failed: ${error}`);
    return { valid: false, error };
  }

  if (options?.allowedExtensions) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !options.allowedExtensions.includes(extension)) {
      const error = `File extension .${extension} not allowed`;
      console.error(`[Storage] Validation failed: ${error}`);
      return { valid: false, error };
    }
  }

  console.log(`[Storage] Validation successful`);
  return { valid: true };
}

export function extractPathFromUrl(url: string): string {
  console.log(`[Storage] Extracting path from URL: ${url}`);
  
  try {
    // Handle Supabase URLs
    if (url.includes("supabase.co/storage/v1/object/public/")) {
      const parts = url.split("/object/public/");
      if (parts.length > 1) {
        const pathParts = parts[1].split("/");
        pathParts.shift(); // Remove bucket name
        const path = pathParts.join("/");
        console.log(`[Storage] Extracted Supabase path: ${path}`);
        return path;
      }
    }
    
    // Handle R2 URLs
    if (url.includes(".r2.dev/") || url.includes(".r2.cloudflarestorage.com/")) {
      const urlObj = new URL(url);
      const path = urlObj.pathname.substring(1); // Remove leading slash
      console.log(`[Storage] Extracted R2 path: ${path}`);
      return path;
    }

    // Fallback: return last part of URL
    const path = url.split("/").pop() || "";
    console.log(`[Storage] Extracted fallback path: ${path}`);
    return path;
  } catch (error) {
    console.error("[Storage] Error extracting path:", error);
    return "";
  }
}
