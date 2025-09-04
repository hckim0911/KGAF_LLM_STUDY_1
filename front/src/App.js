import React from 'react';
import PropTypes from 'prop-types';
import { AuthProvider } from './utils/authContext';
import AppRouter from './router/AppRouter';
import styles from './App.module.css';

function App({ authProviderProps, appRouterProps, onAppMount }) {
  React.useEffect(() => {
    if (onAppMount) {
      onAppMount();
    }
  }, [onAppMount]);

  return (
    <AuthProvider {...authProviderProps}>
      <div className={styles.app}>
        <AppRouter {...appRouterProps} />
      </div>
    </AuthProvider>
  );
}

App.propTypes = {
  authProviderProps: PropTypes.object,
  appRouterProps: PropTypes.object,
  onAppMount: PropTypes.func,
};

export default App;
