import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import styles from './ApiKeyModal.module.css';

const ApiKeyModal = ({ apiKey, onApiKeyChange, onSubmit, onClose }) => {
  const handleSubmit = () => {
    onSubmit();
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>OpenAI API 키 설정</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <label htmlFor='api-key-input' className={styles.label}>
            API 키 입력:
          </label>
          <input
            id='api-key-input'
            type='password'
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder='sk-...'
            className={styles.input}
          />
        </div>

        <div className={styles.info}>
          <p>• OpenAI 계정에서 API 키를 발급받아 입력해주세요</p>
          <p>• API 키는 브라우저에 임시 저장되며 새로고침 시 삭제됩니다</p>
        </div>

        <div className={styles.actions}>
          <button onClick={handleSubmit} className={styles.submitButton}>
            설정 완료
          </button>
          <button onClick={onClose} className={styles.cancelButton}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

ApiKeyModal.propTypes = {
  apiKey: PropTypes.string.isRequired,
  onApiKeyChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ApiKeyModal;
