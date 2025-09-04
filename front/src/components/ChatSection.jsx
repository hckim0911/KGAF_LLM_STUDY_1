import PropTypes from 'prop-types';
import { Send, Key, MessageSquare, Search } from 'lucide-react';
import MessageList from './MessageList';
import LoadingIndicator from './LoadingIndicator';
import { formatVideoTime } from '../utils/chatRoomManager';
import styles from './ChatSection.module.css';

const ChatSection = ({
  currentChatRoom,
  chatRooms,
  inputMessage,
  isApiKeySet,
  isLoading,
  onInputChange,
  onSendMessage,
  onKeyPress,
  onShowApiModal,
  onShowChatRoomList,
  onShowSearchModal,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>{currentChatRoom?.name || '비디오 분석'}</h2>
            {chatRooms.length > 0 && (
              <button onClick={onShowChatRoomList} className={styles.roomButton} title='채팅방 목록'>
                <MessageSquare size={16} />
                <span className={styles.count}>{chatRooms.length}</span>
              </button>
            )}
          </div>
          <p className={styles.status}>{isApiKeySet ? '✅ OpenAI 연결됨' : '❌ API 키 필요'}</p>
        </div>
        <div className={styles.headerButtons}>
          <button onClick={onShowSearchModal} className={styles.searchButton} title='통합 검색'>
            <Search size={20} />
          </button>
          {!isApiKeySet && (
            <button onClick={onShowApiModal} className={styles.apiButton} title='API 키 설정'>
              <Key size={20} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.messagesArea}>
        {/* 캡처된 프레임 미리보기 - 맨 위에 고정 */}
        {currentChatRoom?.capturedFrame && (
          <div className={`${styles.framePreview} ${styles.fixed}`}>
            <div className={styles.frameHeader}>
              <span className={styles.frameTitle}>📸 현재 분석 중인 프레임</span>
              <span className={styles.frameTime}>{formatVideoTime(currentChatRoom.videoCurrentTime)}</span>
            </div>
            <img src={currentChatRoom.capturedFrame} alt='캡처된 비디오 프레임' className={styles.frameImage} />
            <p className={styles.frameInfo}>이 화면에 대한 질문을 AI에게 할 수 있습니다.</p>
          </div>
        )}

        <div className={styles.messagesContainer}>
          <MessageList messages={currentChatRoom?.messages || []} />
          {isLoading && <LoadingIndicator />}
        </div>
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <input
            type='text'
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={isApiKeySet ? '이 화면에 대해 질문해보세요...' : '먼저 API 키를 설정해주세요'}
            disabled={isLoading}
            className={`${styles.input} ${isLoading ? styles.disabled : ''}`}
          />
          <button
            onClick={onSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className={`${styles.sendButton} ${isLoading || !inputMessage.trim() ? styles.disabled : ''}`}
          >
            <Send size={20} />
          </button>
        </div>

        {!isApiKeySet && (
          <div className={styles.setupLink}>
            <button onClick={onShowApiModal} className={styles.linkButton}>
              OpenAI API 키 설정하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

ChatSection.propTypes = {
  currentChatRoom: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    messages: PropTypes.array,
    capturedFrame: PropTypes.string,
    videoCurrentTime: PropTypes.number,
  }),
  chatRooms: PropTypes.array.isRequired,
  inputMessage: PropTypes.string.isRequired,
  isApiKeySet: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  onShowApiModal: PropTypes.func.isRequired,
  onShowChatRoomList: PropTypes.func.isRequired,
  onShowSearchModal: PropTypes.func.isRequired,
};

export default ChatSection;
