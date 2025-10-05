/**
 * Video frame extraction utilities for thumbnail generation
 */

export interface VideoFrameResult {
  blob: Blob;
  dataUrl: string;
  timestamp: number;
}

/**
 * Extracts a frame from a video at a specific timestamp
 * @param videoFile - The video file to extract from
 * @param timestamp - Time in seconds (default: middle of video)
 * @returns Frame as blob and data URL
 */
export async function extractVideoFrame(
  videoFile: File | string,
  timestamp?: number
): Promise<VideoFrameResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const videoUrl =
      typeof videoFile === 'string' ? videoFile : URL.createObjectURL(videoFile);

    video.addEventListener('loadedmetadata', () => {
      // Use provided timestamp or middle of video
      const seekTime = timestamp ?? video.duration / 2;

      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (typeof videoFile !== 'string') {
            URL.revokeObjectURL(videoUrl);
          }

          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

          resolve({
            blob,
            dataUrl,
            timestamp: video.currentTime,
          });
        },
        'image/jpeg',
        0.9
      );
    });

    video.addEventListener('error', () => {
      if (typeof videoFile !== 'string') {
        URL.revokeObjectURL(videoUrl);
      }
      reject(new Error('Failed to load video'));
    });

    // Set a timeout to prevent hanging
    setTimeout(() => {
      if (typeof videoFile !== 'string') {
        URL.revokeObjectURL(videoUrl);
      }
      reject(new Error('Video frame extraction timeout'));
    }, 15000); // 15 second timeout

    video.src = videoUrl;
    video.load();
  });
}

/**
 * Generates multiple thumbnail previews from a video
 * @param videoFile - The video file
 * @param count - Number of thumbnails to generate (default: 6)
 * @returns Array of frame results
 */
export async function generateThumbnailPreviews(
  videoFile: File | string,
  count = 6
): Promise<VideoFrameResult[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl =
      typeof videoFile === 'string' ? videoFile : URL.createObjectURL(videoFile);

    video.addEventListener('loadedmetadata', async () => {
      const duration = video.duration;
      const frames: VideoFrameResult[] = [];

      // Generate timestamps evenly distributed across the video
      const timestamps = Array.from({ length: count }, (_, i) => {
        // Skip first and last 5% of video to avoid black frames
        const progress = (i + 1) / (count + 1);
        return duration * progress;
      });

      try {
        for (const timestamp of timestamps) {
          const frame = await extractVideoFrame(videoUrl, timestamp);
          frames.push(frame);
        }

        if (typeof videoFile !== 'string') {
          URL.revokeObjectURL(videoUrl);
        }

        resolve(frames);
      } catch (error) {
        if (typeof videoFile !== 'string') {
          URL.revokeObjectURL(videoUrl);
        }
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      if (typeof videoFile !== 'string') {
        URL.revokeObjectURL(videoUrl);
      }
      reject(new Error('Failed to load video for thumbnails'));
    });

    video.src = videoUrl;
    video.load();
  });
}

/**
 * Converts a blob to a File object
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

/**
 * Format timestamp for display (MM:SS)
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
