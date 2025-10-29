import api from '../client';

// OpenAI API 키 저장
export const saveApiKey = async (apiKey) => {
  try {
    const response = await api.post('/users/openai-key/save', {
      api_key: apiKey,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to save API key:', error);
    throw error;
  }
};

// OpenAI API 키 삭제
export const deleteApiKey = async () => {
  try {
    const response = await api.delete('/users/openai-key');
    return response.data;
  } catch (error) {
    console.error('Failed to delete API key:', error);
    throw error;
  }
};

// OpenAI API 키 상태 확인
export const getApiKeyStatus = async () => {
  try {
    const response = await api.get('/users/openai-key/status');
    return response.data;
  } catch (error) {
    console.error('Failed to get API key status:', error);
    throw error;
  }
};
