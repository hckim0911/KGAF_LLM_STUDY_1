import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../utils/authContext';
import { initializeGoogleLogin, handleGoogleResponse } from '../utils/googleAuth';
import styles from './GoogleLoginButton.module.css';

const GoogleLoginButton = ({ title, description, onLoginSuccess, onLoginError }) => {
  const { login } = useAuth();

  useEffect(() => {
    const handleResponse = (response) => {
      try {
        handleGoogleResponse(response, login);
        if (onLoginSuccess) {
          onLoginSuccess(response);
        }
      } catch (error) {
        if (onLoginError) {
          onLoginError(error);
        }
      }
    };

    initializeGoogleLogin(handleResponse);
  }, [login, onLoginSuccess, onLoginError]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div id='googleLoginButton' className={styles.buttonContainer}></div>
      <p className={styles.description}>{description}</p>
    </div>
  );
};

GoogleLoginButton.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  onLoginSuccess: PropTypes.func,
  onLoginError: PropTypes.func,
};

export default GoogleLoginButton;
