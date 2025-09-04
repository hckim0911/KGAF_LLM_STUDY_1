import { useEffect } from 'react';
import { useAuth } from '../utils/authContext';
import { initializeGoogleLogin, handleGoogleResponse } from '../utils/googleAuth';
import styles from './GoogleLoginButton.module.css';
import { logError } from '../api/log';

const GoogleLoginButton = () => {
  const { login } = useAuth();

  useEffect(() => {
    const handleResponse = (response) => {
      try {
        handleGoogleResponse(response, login);
      } catch (error) {
        logError('Google 로그인 중 오류', error, 'GoogleLoginButton.jsx');
      }
    };

    initializeGoogleLogin(handleResponse);
  }, [login]);

  return (
    <div className={styles.container}>
      <div id='googleLoginButton' className={styles.buttonContainer}></div>
    </div>
  );
};

export default GoogleLoginButton;
