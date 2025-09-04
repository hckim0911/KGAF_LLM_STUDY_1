import GoogleLoginButton from '../components/GoogleLoginButton';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>{<GoogleLoginButton />}</div>
    </div>
  );
};

export default LoginPage;
