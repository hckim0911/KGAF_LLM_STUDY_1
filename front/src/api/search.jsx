import api from './axiosInstance';

// 텍스트 검색 (JSON 기반)
export const searchByText = async (query, topK = 10, contentType = null) => {
  const requestBody = {
    query: query,
    top_k: topK,
  };

  if (contentType) {
    requestBody.content_type = contentType;
  }

  const response = await api.post('/search', requestBody, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// 하이브리드 검색 (JSON + Base64 이미지)
export const searchHybrid = async (text = null, imageFile = null, textWeight = 0.5, topK = 10) => {
  let imageBase64 = null;

  if (imageFile) {
    imageBase64 = await fileToBase64(imageFile);
  }

  const requestBody = {
    text: text,
    image_base64: imageBase64,
    text_weight: textWeight,
    top_k: topK,
  };

  const response = await api.post('/search/hybrid-json', requestBody, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// 파일을 Base64로 변환하는 헬퍼 함수
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
