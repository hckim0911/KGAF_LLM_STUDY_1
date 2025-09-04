import PropTypes from 'prop-types';
import { X, Camera, Trash2 } from 'lucide-react';
import { formatVideoTime } from '../utils/chatRoomManager';
import styles from './ChatRoomList.module.css';

const ChatRoomList = ({ chatRooms, currentChatRoomId, onSwitchRoom, onDeleteRoom, onClose }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>채팅방 목록</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.list}>
          {chatRooms.map((room) => (
            <div
              key={room.id}
              className={`${styles.item} ${room.id === currentChatRoomId ? styles.active : ''}`}
              onClick={() => onSwitchRoom(room.id)}
            >
              <div className={styles.info}>
                <div className={styles.roomHeader}>
                  <div className={styles.icon}>
                    <Camera size={16} />
                  </div>
                  <span className={styles.name}>{room.name}</span>
                  {room.id === currentChatRoomId && <span className={styles.current}>현재</span>}
                </div>

                {room.capturedFrame && (
                  <div className={styles.preview}>
                    <img src={room.capturedFrame} alt='프레임 미리보기' className={styles.image} />
                  </div>
                )}

                <div className={styles.meta}>
                  <span className={styles.count}>메시지 {room.messages.length}개</span>
                  <span className={styles.time}>영상 시간: {formatVideoTime(room.videoCurrentTime)}</span>
                </div>
              </div>

              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRoom(room.id);
                }}
                title='채팅방 삭제'
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.infoBox}>
          <p>💡 영상을 일시정지하면 해당 시간대의 채팅방으로 이동합니다. 같은 시간대가 없으면 새로 생성됩니다.</p>
        </div>
      </div>
    </div>
  );
};

ChatRoomList.propTypes = {
  chatRooms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      messages: PropTypes.array.isRequired,
      capturedFrame: PropTypes.string,
      videoCurrentTime: PropTypes.number.isRequired,
    })
  ).isRequired,
  currentChatRoomId: PropTypes.number,
  onSwitchRoom: PropTypes.func.isRequired,
  onDeleteRoom: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ChatRoomList;
