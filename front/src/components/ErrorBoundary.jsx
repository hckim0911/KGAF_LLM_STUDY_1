import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // 에러 로깅 (실제 프로젝트에서는 에러 리포팅 서비스 사용)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.errorBox}>
            <div className={styles.icon}>⚠️</div>
            <h2 className={styles.title}>문제가 발생했습니다</h2>
            <p className={styles.description}>
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>

            <div className={styles.buttonGroup}>
              <button onClick={this.handleReload} className={styles.reloadButton}>
                페이지 새로고침
              </button>
            </div>

            {/* 개발 모드에서만 에러 세부 정보 표시 */}
            {process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorSummary}>에러 세부 정보 (개발 모드)</summary>
                <div className={styles.errorContent}>
                  <h4>Error:</h4>
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
