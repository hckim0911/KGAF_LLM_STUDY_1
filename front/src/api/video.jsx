import api from './axiosInstance';

// 영상 업로드
export const uploadVideo = async (videoFile, title, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', videoFile);
  formData.append('title', title);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await api.post('/videos/upload', formData);
  return response.data;
};

// 프레임 이미지 저장
export const saveFrame = async (frameFile, timestamp, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', frameFile);
  formData.append('timestamp', timestamp.toString());
  formData.append('metadata', JSON.stringify(metadata));

  const response = await api.post('/frames/save', formData);
  return response.data;
};
