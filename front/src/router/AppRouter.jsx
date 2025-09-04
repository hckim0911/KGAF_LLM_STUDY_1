import PropTypes from 'prop-types';
import { useAuth } from '../utils/authContext';
import LoginPage from '../pages/LoginPage';
import MainPage from '../pages/MainPage';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './AppRouter.module.css';

const AppRouter = ({ loginPageProps, dashboardProps, loadingMessage, customLoadingComponent }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.container}>{customLoadingComponent || <LoadingSpinner message={loadingMessage} />}</div>
    );
  }

  return (
    <div className={styles.routerWrapper}>
      {user ? <MainPage {...dashboardProps} /> : <LoginPage {...loginPageProps} />}
    </div>
  );
};

AppRouter.propTypes = {
  loginPageProps: PropTypes.object,
  dashboardProps: PropTypes.object,
  loadingMessage: PropTypes.string,
  customLoadingComponent: PropTypes.node,
};

export default AppRouter;
