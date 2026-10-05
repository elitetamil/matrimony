// src/lib/supabase.ts
// Supabase client singleton — use this everywhere instead of creating multiple instances.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ── Storage helpers ────────────────────────────────────────────────────

export const PROFILE_PHOTOS_BUCKET = 'profile-photos';
export const VERIFICATION_DOCS_BUCKET = 'verification-documents';

/**
 * Get the public URL for a profile photo.
 */
export function getProfilePhotoUrl(userId: string, filename: string): string {
  const { data } = supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .getPublicUrl(`${userId}/${filename}`);
  return data.publicUrl;
}

/**
 * Upload a profile photo to Supabase Storage.
 * Compresses/resizes the image before upload using a canvas.
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string> {
  // Compress image to max 800px wide, JPEG quality 0.82
  const compressed = await compressImage(file, 800, 0.82);
  const extension = 'jpg';
  const filename = `avatar_${Date.now()}.${extension}`;
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .upload(path, compressed, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return getProfilePhotoUrl(userId, filename);
}

/**
 * Delete a profile photo from Supabase Storage.
 */
export async function deleteProfilePhoto(
  userId: string,
  filename: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .remove([`${userId}/${filename}`]);
  if (error) throw new Error(`Photo delete failed: ${error.message}`);
}

/**
 * Upload a horoscope document (PDF/JPG/PNG) to Supabase Storage.
 */
export async function uploadHoroscopeFile(
  userId: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `horoscope_${Date.now()}.${ext}`;
  const path = `horoscopes/${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      upsert: true,
    });

  if (error) throw new Error(`Horoscope upload failed: ${error.message}`);
  const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, fileName: file.name };
}


/**
 * Upload a verification document (private bucket).
 */
export async function uploadVerificationDoc(
  userId: string,
  file: File,
  docType: string
): Promise<string> {
  const ext = file.name.split('.').pop() || 'pdf';
  const filename = `${docType}_${Date.now()}.${ext}`;
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(VERIFICATION_DOCS_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw new Error(`Document upload failed: ${error.message}`);
  return path; // Return path only — private bucket, generate signed URL on demand
}

/**
 * Get a signed URL for a private verification document.
 */
export async function getVerificationDocUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(VERIFICATION_DOCS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

// ── Image compression utility ──────────────────────────────────────────

function compressImage(
  file: File,
  maxWidth: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas compression failed'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}
