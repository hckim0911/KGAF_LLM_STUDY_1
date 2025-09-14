import api from './axiosInstance';

export const login = async (idToken) => {
  // const response = await api.post('/auth/login', { id_token: idToken });
  // if (response.status === 200) {
  //   return response.data;
  // }
  // 현재는 서버를 거치지 않고 진행
  return parseJWT(idToken);
};

// 사용자 프로필 조회 (API 키 상태 포함)
export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
};

// API 키 저장
export const saveApiKey = async (apiKey) => {
  try {
    const response = await api.post('/users/openai-key/save', {
      api_key: apiKey
    });
    return response.data;
  } catch (error) {
    console.error('Failed to save API key:', error);
    throw error;
  }
};

// API 키 상태 확인
export const getApiKeyStatus = async () => {
  try {
    const response = await api.get('/users/openai-key/status');
    return response.data;
  } catch (error) {
    console.error('Failed to get API key status:', error);
    throw error;
  }
};

// 사용자 로그인 (백엔드)
export const loginUser = async (userId, name, email) => {
  try {
    const response = await api.post('/users/login', {
      user_id: userId,
      name: name,
      email: email
    });
    return response.data;
  } catch (error) {
    console.error('Failed to login user:', error);
    throw error;
  }
};

const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
};
