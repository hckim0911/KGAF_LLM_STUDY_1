// Google 로그인 관련 유틸리티 함수들

import { login } from '../api/auth';

export const initializeGoogleLogin = (onResponse) => {
  // Google API 스크립트가 이미 로드되었는지 확인
  if (!window.google) {
    loadGoogleScript(() => {
      setupGoogleLogin(onResponse);
    });
  } else {
    setupGoogleLogin(onResponse);
  }
};

const loadGoogleScript = (callback) => {
  // Google API 스크립트 동적 로드
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = callback;
  script.onerror = () => {
    console.error('Google API 스크립트 로드 실패');
  };
  document.head.appendChild(script);
};

const setupGoogleLogin = (onResponse) => {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.initialize({
      // 여기에 실제 Google OAuth Client ID를 넣어야 합니다
      client_id: '119559413062-187sj90u87doqv8p3h8nb0r3clul52bl.apps.googleusercontent.com',
      callback: onResponse,
    });

    window.google.accounts.id.renderButton(document.getElementById('googleLoginButton'), {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: '300',
    });
  }
};

export const handleGoogleResponse = async (response, loginCallback) => {
  if (response.credential) {
    try {
      const decoded = await login(response.credential);

      const userData = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        token: response.credential, // 서버에 저장할 토큰
      };

      loginCallback(userData, response.credential);
    } catch (error) {
      console.error('Google 로그인 처리 중 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  }
};
