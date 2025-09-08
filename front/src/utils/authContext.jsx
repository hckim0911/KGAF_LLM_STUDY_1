import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { setUserForApiRequests } from '../api/axiosInstance';
import { loginUser } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, onLoginSuccess, onLogoutSuccess, initialLoading = true }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(initialLoading);

  const tokenKey = 'auth_token';
  const userDataKey = 'user_data';

  useEffect(() => {
    // 페이지 로드 시 기존 로그인 상태 확인
    const token = localStorage.getItem(tokenKey);
    const userData = localStorage.getItem(userDataKey);

    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setUser(parsedUserData);
        setUserForApiRequests(parsedUserData);
        if (onLoginSuccess) {
          onLoginSuccess(parsedUserData, token);
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userDataKey);
      }
    }
    setLoading(false);
  }, [tokenKey, userDataKey, onLoginSuccess]);

  const login = async (id, name, email, token = 'local_token') => {
    const userData = { id, name, email };
    
    try {
      // 백엔드에 로그인 정보 전송
      await loginUser(id, name, email);
      
      setUser(userData);
      setUserForApiRequests(userData);
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userDataKey, JSON.stringify(userData));

      if (onLoginSuccess) {
        onLoginSuccess(userData, token);
      }
    } catch (error) {
      console.error('Backend login failed:', error);
      // 백엔드 로그인 실패시에도 프론트엔드에서는 로그인 상태 유지
      setUser(userData);
      setUserForApiRequests(userData);
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userDataKey, JSON.stringify(userData));

      if (onLoginSuccess) {
        onLoginSuccess(userData, token);
      }
    }
  };

  const logout = () => {
    const currentUserData = user;
    setUser(null);
    setUserForApiRequests(null);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userDataKey);

    // Google 로그아웃 (구글 로그인을 사용한 경우에만)
    if (window.google?.accounts?.id && localStorage.getItem(tokenKey) !== 'local_token') {
      window.google.accounts.id.disableAutoSelect();
    }

    if (onLogoutSuccess) {
      onLogoutSuccess(currentUserData);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onLoginSuccess: PropTypes.func,
  onLogoutSuccess: PropTypes.func,
  initialLoading: PropTypes.bool,
};
