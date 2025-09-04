import PropTypes from 'prop-types';
import { useAuth } from '../utils/authContext';
import UserInfo from '../components/UserInfo';
import LogoutButton from '../components/LogoutButton';
import styles from './MainPage.module.css';

const MainPage = ({
  title = '대시보드',
  welcomeMessage = 'Google 로그인이 성공적으로 완료되었습니다.',
  showUserInfo = true,
  userInfoProps = {}, // ✅ 디폴트 객체로 보장
  logoutButtonProps = {}, // ✅ 디폴트 객체로 보장
  children = null,
}) => {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.dashboard}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>{title}</h1>
          <LogoutButton {...logoutButtonProps} />
        </div>

        {/* 메인 콘텐츠 */}
        <div className={styles.content}>
          <div className={styles.welcomeSection}>
            <h2 className={styles.welcomeTitle}>안녕하세요, {user?.name}님! 👋</h2>
            <p className={styles.welcomeText}>{welcomeMessage}</p>
          </div>

          {showUserInfo && <UserInfo {...userInfoProps} />}

          {children}
        </div>
      </div>
    </div>
  );
};

MainPage.propTypes = {
  title: PropTypes.string,
  welcomeMessage: PropTypes.string,
  showUserInfo: PropTypes.bool,
  userInfoProps: PropTypes.object,
  logoutButtonProps: PropTypes.object,
  children: PropTypes.node,
};

export default MainPage;
