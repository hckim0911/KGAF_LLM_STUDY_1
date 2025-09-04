import { useAuth } from '../utils/authContext';
import LoginPage from '../pages/LoginPage';
import MainPage from '../pages/MainPage';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './AppRouter.module.css';

const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className={styles.container}>{<LoadingSpinner />}</div>;
  }

  return <div className={styles.routerWrapper}>{user ? <MainPage /> : <LoginPage />}</div>;
};

export default AppRouter;
