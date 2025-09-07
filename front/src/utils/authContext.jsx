import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, onLoginSuccess, onLogoutSuccess, initialLoading }) => {
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

  const login = (id, name, email, token = 'local_token') => {
    const userData = { id, name, email };
    setUser(userData);
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userDataKey, JSON.stringify(userData));

    if (onLoginSuccess) {
      onLoginSuccess(userData, token);
    }
  };

  const logout = () => {
    const currentUserData = user;
    setUser(null);
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
