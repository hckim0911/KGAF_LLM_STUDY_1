import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Play, Pause } from 'lucide-react';
import { formatVideoTime } from '../utils/chatRoomManager';
import { generateVideoThumbnails, getClosestThumbnail } from '../utils/videoThumbnails';
import styles from './VideoPlayer.module.css';

const DEFAULT_ASPECT_RATIO = '16 / 9';
const PREVIEW_IMAGE_WIDTH = 160;

const VideoPlayer = ({
  videoFile,
  videoUrl,
  isPlaying,
  videoRef,
  // fileInputRef,
  onVideoToggle,
  onVideoPlay,
  onVideoPause,
  onVideoSeeking,
  onVideoSeeked,
  // onFileUpload,
  // onUploadClick,
}) => {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [scrubTime, setScrubTime] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [wasPlayingBeforeScrub, setWasPlayingBeforeScrub] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPercent, setHoverPercent] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [containerAspectRatio, setContainerAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const progressRef = useRef(null);

  useEffect(() => {
    setDuration(0);
    setCurrentTime(0);
    setScrubTime(null);
    setHoverTime(null);
    setHoverPercent(null);
    setContainerAspectRatio(DEFAULT_ASPECT_RATIO);

    let isCancelled = false;

    if (!videoUrl) {
      setThumbnails([]);
      setThumbnailsLoading(false);
      setThumbnailError(false);
      setContainerAspectRatio(DEFAULT_ASPECT_RATIO);
      return () => {
        isCancelled = true;
      };
    }

    setThumbnails([]);
    setThumbnailsLoading(true);
    setThumbnailError(false);

    generateVideoThumbnails(videoUrl, { interval: 1 })
      .then((result) => {
        if (!isCancelled) {
          setThumbnails(result);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setThumbnailError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setThumbnailsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [videoUrl]);

  const activeTime = useMemo(() => {
    if (isScrubbing && scrubTime !== null) {
      return scrubTime;
    }
    return currentTime;
  }, [isScrubbing, scrubTime, currentTime]);

  const clampedDuration = duration > 0 ? duration : 0;
  const clampedActiveTime = clampedDuration ? Math.min(Math.max(activeTime, 0), clampedDuration) : 0;
  const playbackPercent = clampedDuration ? (clampedActiveTime / clampedDuration) * 100 : 0;
  const safePlaybackPercent = Math.min(Math.max(playbackPercent, 0), 100);

  const previewThumbnail = useMemo(() => {
    if (hoverTime === null) {
      return null;
    }
    return getClosestThumbnail(thumbnails, hoverTime);
  }, [hoverTime, thumbnails]);

  const handleLoadedMetadata = (event) => {
    const videoElement = event.target;
    setDuration(videoElement.duration || 0);
    setCurrentTime(videoElement.currentTime || 0);
    if (videoElement.videoWidth && videoElement.videoHeight) {
      setContainerAspectRatio(`${videoElement.videoWidth} / ${videoElement.videoHeight}`);
    } else {
      setContainerAspectRatio(DEFAULT_ASPECT_RATIO);
    }
  };

  const handleTimeUpdate = (event) => {
    if (isScrubbing) {
      return;
    }
    setCurrentTime(event.target.currentTime);
  };

  const computeRelativePosition = (event) => {
    if (!progressRef.current) {
      return null;
    }
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    const clampedRatio = Math.min(Math.max(ratio, 0), 1);
    return {
      time: clampedRatio * clampedDuration,
      percent: clampedRatio * 100,
    };
  };

  const toDisplayPercent = (percent) => {
    if (percent === null || percent === undefined) {
      return null;
    }
    if (!progressRef.current) {
      return percent;
    }
    const width = progressRef.current.clientWidth || 0;
    if (!width) {
      return percent;
    }
    const halfPreviewPercent = Math.min(((PREVIEW_IMAGE_WIDTH / 2) / width) * 100, 50);
    return Math.min(Math.max(percent, halfPreviewPercent), 100 - halfPreviewPercent);
  };

  const clearHoverState = () => {
    setHoverTime(null);
    setHoverPercent(null);
  };

  const releasePointerCapture = (event) => {
    if (progressRef.current?.hasPointerCapture?.(event.pointerId)) {
      progressRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerDown = (event) => {
    if (!videoRef.current || !clampedDuration) {
      return;
    }
    event.preventDefault();
    progressRef.current?.setPointerCapture?.(event.pointerId);
    const position = computeRelativePosition(event);
    if (!position) {
      return;
    }

    onVideoSeeking();
    setIsScrubbing(true);
    setScrubTime(position.time);
    setHoverTime(position.time);
    setHoverPercent(toDisplayPercent(position.percent));

    const wasPlaying = !videoRef.current.paused;
    setWasPlayingBeforeScrub(wasPlaying);

    if (wasPlaying) {
      videoRef.current.pause();
    }

    videoRef.current.currentTime = position.time;
  };

  const handlePointerMove = (event) => {
    if (!clampedDuration) {
      return;
    }
    const position = computeRelativePosition(event);
    if (!position) {
      return;
    }

    setHoverTime(position.time);
    setHoverPercent(toDisplayPercent(position.percent));

    if (isScrubbing && videoRef.current) {
      setScrubTime(position.time);
      videoRef.current.currentTime = position.time;
    }
  };

  const finishScrubbing = async (event) => {
    if (!isScrubbing || !videoRef.current) {
      return;
    }
    const position = computeRelativePosition(event);
    const finalTime = position ? position.time : clampedActiveTime;

    setIsScrubbing(false);
    setScrubTime(null);
    setCurrentTime(finalTime);
    setHoverTime(finalTime);
    const finalPercent = position ? position.percent : clampedDuration ? (finalTime / clampedDuration) * 100 : null;
    setHoverPercent(toDisplayPercent(finalPercent));

    videoRef.current.currentTime = finalTime;
    onVideoSeeked();

    if (wasPlayingBeforeScrub) {
      try {
        await videoRef.current.play();
      } catch (error) {
        // Autoplay restrictions may block programmatic play; ignore.
      }
    }

    setWasPlayingBeforeScrub(false);
  };

  const handlePointerUp = (event) => {
    releasePointerCapture(event);
    finishScrubbing(event);
  };

  const handlePointerLeave = (event) => {
    if (!isScrubbing) {
      clearHoverState();
    } else {
      // Keep preview aligned with exit position.
      handlePointerMove(event);
    }
  };

  const handlePointerCancel = (event) => {
    releasePointerCapture(event);
    if (isScrubbing) {
      finishScrubbing(event);
    } else {
      clearHoverState();
    }
  };

  const handleVideoSurfaceClick = (event) => {
    if (!videoRef.current || !videoUrl) {
      return;
    }
    if (event.detail > 1 || isScrubbing) {
      return;
    }
    onVideoToggle();
  };

  const displayDuration = formatVideoTime(clampedDuration || 0);
  const displayTime = formatVideoTime(clampedActiveTime || 0);
  const hoverLabel = hoverTime !== null ? formatVideoTime(hoverTime) : '';
  const previewLeft = hoverPercent !== null ? Math.min(Math.max(hoverPercent, 0), 100) : 0;

  return (
    <>
      <div className={styles.container} style={{ aspectRatio: containerAspectRatio }}>
        {videoUrl ? (
          <video
            key={videoUrl}
            ref={videoRef}
            src={videoUrl}
            className={styles.player}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={onVideoPlay}
            onPause={onVideoPause}
            onSeeking={onVideoSeeking}
            onSeeked={onVideoSeeked}
            onClick={handleVideoSurfaceClick}
          >
            비디오를 지원하지 않는 브라우저입니다.
          </video>
        ) : (
          <div className={styles.placeholder}>
            <div>
              <div className={styles.icon}>📹</div>
              <p className={styles.placeholderText}>비디오를 업로드해주세요</p>
            </div>
          </div>
        )}
        {videoUrl && (
          <div className={styles.controlsContainer}>
            <div
              className={styles.timeline}
              ref={progressRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            >
              <div className={styles.timelineTrack} />
              <div className={styles.timelineProgress} style={{ width: `${safePlaybackPercent}%` }} />
              {hoverTime !== null && (
                <div
                  className={styles.timelinePreview}
                  style={{ left: `${previewLeft}%` }}
                >
                  {previewThumbnail?.image && !thumbnailError ? (
                    <img src={previewThumbnail.image} alt={`Preview at ${hoverLabel}`} />
                  ) : (
                    <span className={styles.timelinePreviewFallback}>{hoverLabel}</span>
                  )}
                  <span className={styles.timelinePreviewTime}>{hoverLabel}</span>
                </div>
              )}
            </div>
            <div className={styles.controlsRow}>
              <button type='button' onClick={onVideoToggle} className={styles.controlButton}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <span className={styles.timeInfo}>
                {displayTime} / {displayDuration}
              </span>
              {thumbnailsLoading && <span className={styles.loadingHint}>썸네일 생성 중...</span>}
              {thumbnailError && !thumbnailsLoading && (
                <span className={styles.loadingHint}>썸네일을 불러오지 못했습니다</span>
              )}
            </div>
          </div>
        )}
      </div>

      {videoFile && (
        <div className={styles.fileInfo}>
          <div className={styles.fileDetails}>
            <p className={styles.detail}>
              <strong>파일명:</strong> {videoFile.name}
            </p>
            <p className={styles.detail}>
              <strong>크기:</strong> {(videoFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className={styles.detail}>
              <strong>형식:</strong> {videoFile.type}
            </p>
          </div>
          {videoUrl && (
            <div className={styles.playButtonContainer}>
              <button onClick={onVideoToggle} className={styles.playButton}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? '일시정지' : '재생'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

VideoPlayer.propTypes = {
  videoFile: PropTypes.object,
  videoUrl: PropTypes.string,
  isPlaying: PropTypes.bool.isRequired,
  videoRef: PropTypes.object.isRequired,
  onVideoToggle: PropTypes.func.isRequired,
  onVideoPlay: PropTypes.func.isRequired,
  onVideoPause: PropTypes.func.isRequired,
  onVideoSeeking: PropTypes.func.isRequired,
  onVideoSeeked: PropTypes.func.isRequired,
};

export default VideoPlayer;
