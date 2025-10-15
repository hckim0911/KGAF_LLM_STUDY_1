const DEFAULT_INTERVAL_SECONDS = 5;
const DEFAULT_MAX_THUMBNAILS = 200;
const TARGET_THUMBNAIL_WIDTH = 160;

/**
 * Generate preview thumbnails for a video URL.
 * Captures frames at a fixed interval and returns [{ time, image }] entries.
 */
export const generateVideoThumbnails = (videoUrl, options = {}) => {
  const { interval = DEFAULT_INTERVAL_SECONDS, maxThumbnails = DEFAULT_MAX_THUMBNAILS } = options;

  if (!videoUrl) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    const thumbnails = [];
    let captureTimes = [];
    let currentIndex = 0;

    const cleanup = () => {
      video.pause();
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Failed to load video for thumbnail generation'));
    };

    const captureFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        return;
      }

      const aspectRatio = video.videoWidth / video.videoHeight;
      const width = Math.min(TARGET_THUMBNAIL_WIDTH, video.videoWidth);
      const height = width / aspectRatio;

      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      try {
        thumbnails.push({ time: video.currentTime, image: canvas.toDataURL('image/jpeg', 0.7) });
      } catch (error) {
        cleanup();
        resolve([]);
        return false;
      }
      return true;
    };

    const seekToNextCapture = () => {
      currentIndex += 1;

      if (currentIndex >= captureTimes.length) {
        cleanup();
        resolve(thumbnails);
        return;
      }

      const targetTime = captureTimes[currentIndex];

      if (Math.abs(video.currentTime - targetTime) < 0.001) {
        // Already at target (can happen when duration === targetTime)
        captureFrame();
        seekToNextCapture();
      } else {
        video.currentTime = targetTime;
      }
    };

    const handleSeeked = () => {
      const captured = captureFrame();
      if (captured) {
        seekToNextCapture();
      }
    };

    const handleLoadedMetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;

      if (!duration) {
        cleanup();
        resolve([]);
        return;
      }

      const safeInterval = interval > 0 ? interval : DEFAULT_INTERVAL_SECONDS;
      const times = [];
      let time = 0;

      while (time < duration && times.length < maxThumbnails) {
        times.push(time);
        time += safeInterval;
      }

      if (times[times.length - 1] !== duration && times.length < maxThumbnails) {
        times.push(duration);
      }

      captureTimes = times;
      currentIndex = 0;

      video.currentTime = captureTimes[currentIndex];
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError, { once: true });
  });
};

export const getClosestThumbnail = (thumbnails, timeInSeconds) => {
  if (!thumbnails?.length) {
    return null;
  }

  let closest = thumbnails[0];
  let minDiff = Math.abs(closest.time - timeInSeconds);

  for (let i = 1; i < thumbnails.length; i += 1) {
    const diff = Math.abs(thumbnails[i].time - timeInSeconds);
    if (diff < minDiff) {
      closest = thumbnails[i];
      minDiff = diff;
    }
  }

  return closest;
};
