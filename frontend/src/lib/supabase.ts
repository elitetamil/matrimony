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
export const HOROSCOPES_BUCKET = 'horoscopes';

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
 * Upload a horoscope document (PDF/JPG/PNG) to the PRIVATE Supabase Storage bucket.
 * Stores file at `<userId>/<unique-filename>`.
 */
export async function uploadHoroscopeFile(
  userId: string,
  file: File
): Promise<{ path: string; signedUrl: string; fileName: string; url: string }> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Horoscope file size must be less than 5 MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
  if (!allowedExts.includes(ext)) {
    throw new Error('Invalid file format. Allowed formats: PDF, JPG, JPEG, PNG.');
  }

  const filename = `horoscope_${Date.now()}.${ext}`;
  const path = `${userId}/${filename}`;
  const contentType = file.type || (ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg');

  const { error } = await supabase.storage
    .from(HOROSCOPES_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Horoscope upload failed: ${error.message}`);

  // Generate an initial signed URL for immediate preview (valid for 24 hours)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(HOROSCOPES_BUCKET)
    .createSignedUrl(path, 86400);

  if (signedError || !signedData?.signedUrl) {
    throw new Error(`Failed to generate signed URL for horoscope: ${signedError?.message}`);
  }

  return {
    path,
    signedUrl: signedData.signedUrl,
    url: signedData.signedUrl,
    fileName: file.name,
  };
}

/**
 * Generate a fresh signed URL for a private horoscope document.
 * Backward compatible with any legacy horoscope files stored in profile-photos.
 */
export async function getHoroscopeSignedUrl(
  pathOrUrl: string,
  expiresInSeconds = 3600
): Promise<string> {
  if (!pathOrUrl) return '';

  // Backward compatibility: If the file was previously in public profile-photos, return the public URL
  if (pathOrUrl.includes(`/${PROFILE_PHOTOS_BUCKET}/`)) {
    return pathOrUrl;
  }

  // Extract relative storage path e.g. "userId/horoscope_123.pdf"
  let cleanPath = pathOrUrl;
  if (cleanPath.includes(`/${HOROSCOPES_BUCKET}/`)) {
    cleanPath = cleanPath.split(`/${HOROSCOPES_BUCKET}/`)[1];
  }

  const { data, error } = await supabase.storage
    .from(HOROSCOPES_BUCKET)
    .createSignedUrl(cleanPath, expiresInSeconds);

  if (error) {
    console.warn('[getHoroscopeSignedUrl] Error creating signed URL:', error.message);
    throw new Error(`Signed URL generation failed: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete a horoscope document from Supabase Storage.
 * Safe guards ensure profile photos (avatars) are never deleted.
 */
export async function deleteHoroscopeFile(
  userId: string,
  fileUrlOrPath: string
): Promise<void> {
  if (!fileUrlOrPath) return;

  // Safety safeguard: Never delete an avatar/profile photo
  if (fileUrlOrPath.includes('avatar_')) {
    console.warn('[deleteHoroscopeFile] Blocked attempt to delete an avatar file.');
    return;
  }

  // Handle legacy files in profile-photos bucket if explicitly referenced
  if (fileUrlOrPath.includes(`${PROFILE_PHOTOS_BUCKET}/`)) {
    const legacyPath = fileUrlOrPath.split(`${PROFILE_PHOTOS_BUCKET}/`)[1];
    if (legacyPath && legacyPath.includes('horoscope')) {
      const { error } = await supabase.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .remove([legacyPath]);
      if (error) console.warn('[deleteHoroscopeFile] Legacy delete warning:', error.message);
    }
    return;
  }

  // Standard private horoscopes bucket removal
  let storagePath = fileUrlOrPath;
  if (fileUrlOrPath.includes(`${HOROSCOPES_BUCKET}/`)) {
    storagePath = fileUrlOrPath.split(`${HOROSCOPES_BUCKET}/`)[1];
  } else if (!fileUrlOrPath.startsWith(`${userId}/`)) {
    const filename = fileUrlOrPath.split('/').pop() || fileUrlOrPath;
    storagePath = `${userId}/${filename}`;
  }

  const { error } = await supabase.storage
    .from(HOROSCOPES_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.warn('[deleteHoroscopeFile] Storage horoscope delete warning:', error.message);
  }
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
