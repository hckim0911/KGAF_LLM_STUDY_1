import PropTypes from 'prop-types';
import GoogleLoginButton from '../components/GoogleLoginButton';
import styles from './LoginPage.module.css';

const LoginPage = ({ title, description, onLoginSuccess, onLoginError, customContent }) => {
  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        {customContent ? (
          customContent
        ) : (
          <GoogleLoginButton
            title={title}
            description={description}
            onLoginSuccess={onLoginSuccess}
            onLoginError={onLoginError}
          />
        )}
      </div>
    </div>
  );
};

LoginPage.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  onLoginSuccess: PropTypes.func,
  onLoginError: PropTypes.func,
  customContent: PropTypes.node,
};

export default LoginPage;
