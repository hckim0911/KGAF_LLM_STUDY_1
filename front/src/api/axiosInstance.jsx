import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  timeout: 5000,
});

// 요청 인터셉터 (예: 토큰 자동 주입)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 (에러 로깅, 알림 등)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API 에러:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

// 백엔드 연결 상태 확인
export const checkBackendConnection = async () => {
  try {
    const response = await api.get('/');
    return response.status === 200;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};
