import { supabase } from './supabaseClient';

export interface UploadResponse {
  url: string;
  publicId?: string;
  success: boolean;
}

export const cloudStorageApi = {
  /**
   * Upload an image from a local URI directly to Supabase Storage.
   * Returns the public URL of the uploaded file.
   */
  uploadImage: async (
    imageUri: string,
    folder: 'avatars' | 'aadhaar' | 'portfolio' | 'gear' | 'chat' = 'gear'
  ): Promise<UploadResponse> => {
    try {
      const ext = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      } as any);

      const { data, error } = await supabase.storage
        .from(folder)
        .upload(filename, formData, {
          upsert: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      // 4. Get the public URL
      const { data: publicData } = supabase.storage
        .from(folder)
        .getPublicUrl(data.path);

      const publicUrl = publicData.publicUrl;

      return {
        url: publicUrl,
        publicId: data.path,
        success: true,
      };
    } catch (e: any) {
      console.error('Upload failed:', e.message);
      throw new Error('Image upload failed: ' + e.message);
    }
  },

  /**
   * Upload a video from a local URI directly to Supabase Storage.
   * Returns the public URL of the uploaded video.
   */
  uploadVideo: async (
    videoUri: string,
    folder: string = 'reels'
  ): Promise<UploadResponse> => {
    try {
      const ext = videoUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp4';
      const filename = `reel_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      let mimeType = 'video/mp4';
      if (ext === 'mov') mimeType = 'video/quicktime';
      else if (ext === 'webm') mimeType = 'video/webm';
      else if (ext === 'mkv') mimeType = 'video/x-matroska';

      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        name: filename,
        type: mimeType,
      } as any);

      const { data, error } = await supabase.storage
        .from(folder)
        .upload(filename, formData, {
          upsert: true,
          contentType: mimeType,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: publicData } = supabase.storage
        .from(folder)
        .getPublicUrl(data.path);

      return {
        url: publicData.publicUrl,
        publicId: data.path,
        success: true,
      };
    } catch (e: any) {
      console.error('Video upload failed:', e.message);
      throw new Error('Video upload failed: ' + e.message);
    }
  },
};

