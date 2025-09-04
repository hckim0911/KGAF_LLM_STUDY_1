import { useAuth } from '../utils/authContext';
import styles from './UserInfo.module.css';

const UserInfo = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>사용자 정보</h3>

      <div className={styles.infoGrid}>
        {user.picture && (
          <>
            <span className={styles.label}>프로필 사진:</span>
            <img src={user.picture} alt='Profile' referrerPolicy='no-referrer' className={styles.profileImage} />
          </>
        )}

        <span className={styles.label}>이름:</span>
        <span className={styles.value}>{user.name}</span>

        <span className={styles.label}>이메일:</span>
        <span className={styles.value}>{user.email}</span>

        <span className={styles.label}>사용자 ID:</span>
        <span className={styles.userId}>{user.id}</span>
      </div>

      {/* 토큰 정보 */}
      <div className={styles.tokenSection}>
        <h4 className={styles.tokenTitle}>🔑 Google 토큰 (서버 저장용)</h4>
        <p className={styles.tokenDescription}>이 토큰을 서버에 저장하여 사용자 인증에 활용할 수 있습니다.</p>
        <div className={styles.tokenDisplay}>{user.token}</div>
      </div>
    </div>
  );
};

export default UserInfo;
