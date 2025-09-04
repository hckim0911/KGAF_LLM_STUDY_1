import styles from './LoadingIndicator.module.css';

const LoadingIndicator = () => {
  return (
    <div className={styles.container}>
      <div className={styles.bubble}>
        <div className={styles.dots}>
          <div className={`${styles.dot} ${styles.bounce1}`}></div>
          <div className={`${styles.dot} ${styles.bounce2}`}></div>
          <div className={`${styles.dot} ${styles.bounce3}`}></div>
          <span className={styles.text}>응답 생성 중...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
