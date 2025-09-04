import { useAuth } from '../utils/authContext';
import styles from './MainPageHeader.module.css';
import LogoutButton from './LogoutButton';
import { Upload } from 'lucide-react';
import PropTypes from 'prop-types';

const MainPageHeader = ({ fileInputRef, onFileUpload, onUploadClick }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <>
      <div className={styles.container}>
        <span className={styles.greeting}>{user.name}님, 안녕하세요 👋</span>
        <div className={styles.rightSection}>
          <LogoutButton />
          <button onClick={onUploadClick} className={styles.uploadButton}>
            <Upload size={20} />
            영상 업로드
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type='file' accept='video/*' onChange={onFileUpload} style={{ display: 'none' }} />
    </>
  );
};

MainPageHeader.propTypes = {
  fileInputRef: PropTypes.object.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func.isRequired,
};

export default MainPageHeader;
