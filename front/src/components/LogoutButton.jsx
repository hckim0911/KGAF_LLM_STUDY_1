import PropTypes from 'prop-types';
import { useAuth } from '../utils/authContext';
import styles from './LogoutButton.module.css';

const LogoutButton = ({ children, confirmMessage, onLogoutSuccess, variant, disabled }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (disabled) {
      return;
    }

    const shouldLogout = confirmMessage
      ? window.confirm(confirmMessage)
      : window.confirm('정말 로그아웃 하시겠습니까?');

    if (shouldLogout) {
      logout();
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    }
  };

  const buttonClass = variant === 'outline' ? `${styles.button} ${styles.outline}` : styles.button;

  return (
    <button onClick={handleLogout} className={`${buttonClass} ${disabled ? styles.disabled : ''}`} disabled={disabled}>
      {children || '로그아웃'}
    </button>
  );
};

LogoutButton.propTypes = {
  children: PropTypes.node,
  confirmMessage: PropTypes.string,
  onLogoutSuccess: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'outline']),
  disabled: PropTypes.bool,
};

export default LogoutButton;
