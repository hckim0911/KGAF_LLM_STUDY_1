import PropTypes from 'prop-types';
import styles from './MessageList.module.css';

const MessageList = ({ messages }) => {
  const formatTime = (timestamp) => {
    try {
      // timestamp가 이미 Date 객체인지, 문자열인지, 숫자인지 확인
      let date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        date = new Date(); // fallback to current time
      }
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return '시간 미상';
      }
      
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting time:', error, timestamp);
      return '시간 미상';
    }
  };

  return (
    <>
      {messages.map((message) => (
        <div key={message.id} className={`${styles.container} ${message.sender === 'user' ? styles.user : styles.ai}`}>
          <div className={`${styles.bubble} ${message.sender === 'user' ? styles.userBubble : styles.aiBubble}`}>
            <p className={styles.text}>{message.text}</p>
            <p
              className={`${styles.timestamp} ${message.sender === 'user' ? styles.userTimestamp : styles.aiTimestamp}`}
            >
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      text: PropTypes.string.isRequired,
      sender: PropTypes.oneOf(['user', 'ai']).isRequired,
      timestamp: PropTypes.oneOfType([
        PropTypes.instanceOf(Date),
        PropTypes.string,
        PropTypes.number
      ]).isRequired,
    })
  ).isRequired,
};

export default MessageList;
