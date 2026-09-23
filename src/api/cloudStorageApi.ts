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
      const cleanExt = ext.replace(/[^a-z0-9]/g, '');
      const filename = `reel_${Date.now()}_${Math.random().toString(36).slice(2)}.${cleanExt || 'mp4'}`;

      let mimeType = `video/${cleanExt || 'mp4'}`;
      if (cleanExt === 'mov') mimeType = 'video/quicktime';
      else if (cleanExt === 'webm') mimeType = 'video/webm';
      else if (cleanExt === 'mkv') mimeType = 'video/x-matroska';
      else if (cleanExt === 'avi') mimeType = 'video/x-msvideo';
      else if (cleanExt === 'wmv') mimeType = 'video/x-ms-wmv';
      else if (cleanExt === 'flv') mimeType = 'video/x-flv';
      else if (cleanExt === '3gp') mimeType = 'video/3gpp';
      else if (cleanExt === 'm4v') mimeType = 'video/x-m4v';
      else if (cleanExt === 'ts') mimeType = 'video/mp2t';
      else if (cleanExt === 'ogv') mimeType = 'video/ogg';
      else if (cleanExt === 'mp4') mimeType = 'video/mp4';

      let fileBody: any;
      try {
        const fileResponse = await fetch(videoUri);
        fileBody = await fileResponse.blob();
      } catch (blobErr) {
        const formData = new FormData();
        formData.append('file', {
          uri: videoUri,
          name: filename,
          type: mimeType,
        } as any);
        fileBody = formData;
      }

      let activeFolder = folder;
      let uploadResult = await supabase.storage
        .from(activeFolder)
        .upload(filename, fileBody, {
          upsert: false,
          contentType: mimeType,
        });

      if (uploadResult.error && activeFolder !== 'camcrew-media') {
        const fallback = await supabase.storage
          .from('camcrew-media')
          .upload(`reels/${filename}`, fileBody, {
            upsert: false,
            contentType: mimeType,
          });
        if (!fallback.error && fallback.data) {
          uploadResult = fallback;
          activeFolder = 'camcrew-media';
        }
      }

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      const { data: publicData } = supabase.storage
        .from(activeFolder)
        .getPublicUrl(uploadResult.data.path);

      return {
        url: publicData.publicUrl,
        publicId: uploadResult.data.path,
        success: true,
      };
    } catch (e: any) {
      console.error('Video upload failed:', e.message);
      throw new Error('Video upload failed: ' + e.message);
    }
  },
};

