import PropTypes from 'prop-types';
import styles from './MessageList.module.css';

const MessageList = ({ messages }) => {
  const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
      id: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired,
      sender: PropTypes.oneOf(['user', 'ai']).isRequired,
      timestamp: PropTypes.instanceOf(Date).isRequired,
    })
  ).isRequired,
};

export default MessageList;
