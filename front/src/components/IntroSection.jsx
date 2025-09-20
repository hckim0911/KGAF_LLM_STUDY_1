import PropTypes from 'prop-types';
import styles from './IntroSection.module.css';

const IntroSection = ({ isApiKeySet, onShowApiModal }) => {
  return (
    <div className={styles.section}>
      <div className={styles.content}>
        <h2>영상을 업로드하고 일시정지하세요</h2>
        <p>궁금한 장면에서 일시정지하면 해당 프레임에 대한 채팅방이 생성됩니다.</p>

        <div className={styles.apiSection}>
          {isApiKeySet && <div className={styles.apiStatus}>✅ OpenAI API 연결됨</div>}
          <button onClick={onShowApiModal} className={styles.apiButton}>
            {isApiKeySet ? 'OpenAI API 키 다시 설정하기' : 'OpenAI API 키 설정하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

IntroSection.propTypes = {
  isApiKeySet: PropTypes.bool.isRequired,
  onShowApiModal: PropTypes.func.isRequired,
};

export default IntroSection;
