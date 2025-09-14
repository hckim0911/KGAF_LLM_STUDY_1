import api from '../api/axiosInstance';

export const callOpenAI = async (message, videoFile, capturedFrame) => {
  try {
    const response = await api.post('/openai/chat', {
      message: message,
      captured_frame: capturedFrame,
      video_file_name: videoFile ? videoFile.name : null
    });

    return response.data.message;
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    
    if (error.response) {
      const errorMsg = error.response.data.detail || 'API 호출 중 오류가 발생했습니다.';
      if (error.response.status === 400) {
        return 'OpenAI API 키가 설정되지 않았습니다. API 키를 설정해주세요.';
      } else if (error.response.status === 401) {
        return 'OpenAI API 키가 올바르지 않습니다. API 키를 확인해주세요.';
      } else if (error.response.status === 429) {
        return 'OpenAI API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.';
      }
      return errorMsg;
    }
    
    return '죄송합니다. API 호출 중 오류가 발생했습니다.';
  }
};

export const captureVideoFrame = (videoRef, videoUrl) => {
  if (!videoRef.current || !videoUrl) {
    console.log('비디오가 없음');
    return null;
  }

  try {
    const video = videoRef.current;

    // 비디오가 로드되지 않았거나 크기가 0인 경우
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('비디오 크기가 0임');
      return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 스크린샷 크기 (더 작게 설정)
    const maxWidth = 512;
    const maxHeight = 512;
    let { videoWidth, videoHeight } = video;

    // 비율 유지하면서 크기 조정
    if (videoWidth > maxWidth || videoHeight > maxHeight) {
      const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
      videoWidth *= ratio;
      videoHeight *= ratio;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // 현재 프레임의 단일 이미지만 캡처
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    // 단일 이미지를 base64로 변환
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    console.log('단일 스크린샷 캡처 완료, 크기:', Math.round(dataUrl.length / 1024), 'KB');
    return dataUrl;
  } catch (error) {
    console.error('스크린샷 캡처 오류:', error);
    return null;
  }
};