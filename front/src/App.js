import React from 'react';
import { AuthProvider } from './utils/authContext';
import AppRouter from './router/AppRouter';
import styles from './App.module.css';

const onLoginSuccess = () => {
  console.log('로그인 성공');
};

const onLogoutSuccess = () => {
  console.log('로그아웃 성공');
};

function App() {
  return (
    <AuthProvider onLoginSuccess={onLoginSuccess} onLogoutSuccess={onLogoutSuccess}>
      <div className={styles.app}>
        <AppRouter />
      </div>
    </AuthProvider>
  );
}

export default App;
