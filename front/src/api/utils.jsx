// 비디오에서 특정 시간의 프레임을 캡처하여 Blob으로 반환
export const captureVideoFrame = (videoElement) => {
  return new Promise((resolve) => {
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 비디오 크기에 맞게 캔버스 설정
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // 현재 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // 캔버스를 Blob으로 변환
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.8
    );
  });
};

// 파일을 Base64로 변환하는 헬퍼 함수
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// 상수 export
export const BACKEND_BASE_URL = '/';
