import api from './axiosInstance';

// 대화 저장 (질문 + 이미지 + 응답)
export const saveConversation = async (question, answer, questionImage = null, timestamp = 0.0, videoId = null) => {
  // Input validation
  if (!question || typeof question !== 'string') {
    throw new Error(`Invalid question: ${typeof question} - ${question}`);
  }

  if (!answer || typeof answer !== 'string') {
    throw new Error(`Invalid answer: ${typeof answer} - ${answer}`);
  }

  const formData = new FormData();
  formData.append('question', question.trim());
  formData.append('answer', answer.trim());
  if (questionImage) {
    formData.append('question_image', questionImage);
  }
  formData.append('timestamp', timestamp.toString());
  if (videoId) {
    formData.append('video_id', videoId.toString());
  }

  const response = await api.post('/conversations/save', formData);
  return response.data;
};

// 대화 검색
export const searchConversations = async (query, topK = 10) => {
  const requestBody = {
    query: query,
    top_k: topK,
  };

  const response = await api.post('/conversations/search', requestBody, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// 대화 기록 조회
export const getConversationHistory = async (limit = 50, offset = 0) => {
  const response = await api.get('/conversations/history', {
    params: {
      limit,
      offset
    }
  });
  return response.data;
};
