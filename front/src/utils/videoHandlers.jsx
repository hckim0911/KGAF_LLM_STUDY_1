import { captureVideoFrame } from './openai';
import { findOrCreateChatRoom } from './chatRoomManager';
import { uploadVideo } from '../api/media';
import { saveChatRoom } from '../api/chatrooms';

// 사용자 의도를 구분하기 위한 변수들
let lastSeekTime = 0;
let isUserSeeking = false;
let pauseTimeout = null;
let lastPauseTime = 0;

// 수동 일시정지 처리 함수
const handleManualPause = async (videoRef, videoUrl, videoId, chatRooms, setChatRooms, setCurrentChatRoomId) => {
  const frameData = captureVideoFrame(videoRef, videoUrl);
  if (frameData) {
    const frameTime = new Date();
    const videoCurrentTime = videoRef.current.currentTime;

    const { room, isNew } = findOrCreateChatRoom(chatRooms, frameData, frameTime, videoCurrentTime, videoId);

    if (isNew) {
      setChatRooms((prev) => [...prev, room]);
      console.log('새 채팅방 생성 - 프레임 캡처 완료:', Math.round(frameData.length / 1024), 'KB');

      if (videoId) {
        try {
          await saveChatRoom(room, videoId);
        } catch (error) {
          console.error('Failed to save new chat room to backend:', error);
        }
      }
    } else {
      console.log('기존 채팅방으로 이동:', room.name);
    }

    setCurrentChatRoomId(room.id);
  }
};

// 비디오 재생/일시정지 핸들러
export const createVideoToggleHandler = (
  videoRef,
  videoUrl,
  videoId,
  isPlaying,
  setIsPlaying,
  chatRooms,
  setChatRooms,
  setCurrentChatRoomId
) => {
  return async () => {
    if (videoRef.current && videoUrl) {
      if (isPlaying) {
        videoRef.current.pause();
        // 비디오가 일시정지될 때 채팅방 찾기 또는 생성
        await handleManualPause(videoRef, videoUrl, videoId, chatRooms, setChatRooms, setCurrentChatRoomId);
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
};

// 비디오 seeking 감지 핸들러
export const createVideoSeekingHandler = () => {
  return () => {
    isUserSeeking = true;
    lastSeekTime = Date.now();
    console.log('🔍 Seeking 시작됨');

    // 기존 pause timeout 취소
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
      console.log('⏸️ Pause timeout 취소됨 (seeking 중)');
    }
  };
};

// 비디오 seeked 감지 핸들러
export const createVideoSeekedHandler = () => {
  return () => {
    console.log('🎯 Seeking 완료됨');

    // seeking이 끝난 후 충분한 시간 대기
    setTimeout(() => {
      isUserSeeking = false;
      console.log('✅ Seeking 플래그 해제됨');
    }, 200);
  };
};

// 비디오 일시정지 핸들러 (비디오 컨트롤에서 직접 호출)
export const createVideoPauseHandler = (
  videoRef,
  videoUrl,
  videoId,
  setIsPlaying,
  chatRooms,
  setChatRooms,
  setCurrentChatRoomId
) => {
  return async () => {
    setIsPlaying(false);

    const now = Date.now();

    // seeking 중이거나 최근에 seek했다면 채팅방 생성하지 않음
    const timeSinceSeek = now - lastSeekTime;
    if (isUserSeeking || timeSinceSeek < 500) {
      console.log('Seeking으로 인한 일시정지 - 채팅방 생성 안함');
      return;
    }

    // 너무 빠른 연속 일시정지 방지 (1초 이내)
    const timeSinceLastPause = now - lastPauseTime;
    if (timeSinceLastPause < 1000) {
      console.log('연속 일시정지 방지 - 채팅방 생성 안함');
      return;
    }

    lastPauseTime = now;

    // 기존 timeout 제거
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
    }

    // 약간의 지연 후 채팅방 생성 (빠른 재생/일시정지 방지)
    pauseTimeout = setTimeout(async () => {
      if (videoRef.current && videoRef.current.paused && !isUserSeeking) {
        console.log('✅ 의도적인 일시정지 감지 - 채팅방 생성');
        await handleManualPause(videoRef, videoUrl, videoId, chatRooms, setChatRooms, setCurrentChatRoomId);
      }
      pauseTimeout = null;
    }, 300);
  };
};

// 비디오 재생 핸들러 (비디오 컨트롤에서 직접 호출)
export const createVideoPlayHandler = (setIsPlaying) => {
  return () => {
    setIsPlaying(true);
    // 재생 시 pending된 pause 처리 취소
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
    }
  };
};

// 파일 업로드 핸들러
export const createFileUploadHandler = (
  setVideoFile,
  setVideoUrl,
  setVideoId,
  setIsPlaying,
  setChatRooms,
  setCurrentChatRoomId,
  videoUrl,
  videoRef
) => {
  return async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      // 기존 URL이 있다면 메모리에서 해제
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        console.log('기존 비디오 URL 해제됨');
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        console.log('기존 비디오 정지됨');
      }

      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setIsPlaying(false);

      setChatRooms([]);
      setCurrentChatRoomId(null);
      setVideoId(null);

      try {
        const title = file.name || 'untitled';
        const metadata = {
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };

        // 서버 업로드 실행
        const result = await uploadVideo(file, title, metadata);
        console.log('업로드 완료:', result);

        if (result?.video_id) {
          setVideoId(result.video_id);
        }
      } catch (err) {
        console.error('업로드 실패:', err);
        alert('영상 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } else {
      alert('비디오 파일만 업로드 가능합니다.');
    }
  };
};

// 업로드 클릭 핸들러
export const createUploadClickHandler = (fileInputRef) => {
  return () => {
    fileInputRef.current?.click();
  };
};
