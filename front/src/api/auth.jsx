// import api from './axiosInstance';

export const login = async (idToken) => {
  // const response = await api.post('/auth/login', { id_token: idToken });
  // if (response.status === 200) {
  //   return response.data;
  // }
  // 현재는 서버를 거치지 않고 진행
  return parseJWT(idToken);
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
