import React, { useState, useEffect } from 'react';
import { getAllChatRooms, deleteChatRoom } from '../api/chat';
import { Trash2, GripVertical } from 'lucide-react';
import styles from './ConversationHistory.module.css';

const ConversationHistory = ({ onSelectChatRoom, className = '', refreshTrigger = 0 }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const data = await getAllChatRooms(); // 모든 채팅방 가져오기
      setChatRooms(data.chat_rooms || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load chat room history:', err);
      setError('채팅방 기록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatRooms();
  }, [refreshTrigger]);

  const handleChatRoomClick = (chatRoom) => {
    onSelectChatRoom(chatRoom);
  };

  const handleDeleteChatRoom = async (chatRoomId, event) => {
    event.stopPropagation(); // 클릭 이벤트 버블링 방지
    
    if (window.confirm('이 채팅방을 삭제하시겠습니까?')) {
      try {
        await deleteChatRoom(chatRoomId);
        // 로컬 상태에서도 제거
        setChatRooms(prev => prev.filter(room => room.room_id !== chatRoomId));
      } catch (error) {
        console.error('Failed to delete chat room:', error);
        alert('채팅방 삭제에 실패했습니다.');
      }
    }
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // 일부 브라우저에서 필요
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 현재 드래그 중인 아이템과 다른 아이템에만 드래그 오버 효과 적용
    if (draggedItem !== index) {
      setDragOverItem(index);
    }
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedItem !== index) {
      setDragOverItem(index);
    }
  };

  const handleDragLeave = (e) => {
    // 실제로 요소를 벗어났을 때만 처리 (자식 요소로의 이동 무시)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newChatRooms = [...chatRooms];
    const draggedChatRoom = newChatRooms[draggedItem];
    
    // 간단한 배열 재정렬 로직
    newChatRooms.splice(draggedItem, 1); // 드래그된 아이템 제거
    newChatRooms.splice(dropIndex, 0, draggedChatRoom); // 새 위치에 삽입
    
    setChatRooms(newChatRooms);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className={`${styles.conversationHistory} ${className}`}>
        <div className={styles.header}>
          <h3>💬 이전 채팅방</h3>
        </div>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.conversationHistory} ${className}`}>
        <div className={styles.header}>
          <h3>💬 이전 채팅방</h3>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.conversationHistory} ${className}`}>
      <div className={styles.header}>
        <h3>💬 이전 채팅방</h3>
        <span className={styles.count}>({chatRooms.length})</span>
      </div>
      
      {chatRooms.length === 0 ? (
        <div className={styles.empty}>
          <p>아직 채팅방이 없습니다.</p>
          <p>영상에 대해 질문해보세요!</p>
        </div>
      ) : (
        <div className={styles.conversationList}>
          {chatRooms.map((chatRoom, index) => (
            <div
              key={chatRoom._id || chatRoom.room_id}
              className={`${styles.conversationItem} ${
                draggedItem === index ? styles.dragging : ''
              } ${
                dragOverItem === index ? styles.dragOver : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleChatRoomClick(chatRoom)}
            >
              <div className={styles.dragHandle}>
                <GripVertical size={16} className={styles.gripIcon} />
              </div>
              
              <div className={styles.chatRoomLayout}>
                {chatRoom.captured_frame && (
                  <div className={styles.thumbnail}>
                    <img 
                      src={chatRoom.captured_frame} 
                      alt="채팅방 썸네일"
                      className={styles.thumbnailImage}
                    />
                  </div>
                )}
                <div className={styles.conversationContent}>
                  <div className={styles.chatRoomName}>
                    {chatRoom.name.length > 15
                      ? `${chatRoom.name.substring(0, 15)}...`
                      : chatRoom.name}
                  </div>
                  <div className={styles.messageCount}>
                    메시지 {chatRoom.messages?.length || 0}개
                  </div>
                  <div className={styles.lastMessage}>
                    {chatRoom.messages && chatRoom.messages.length > 0
                      ? chatRoom.messages[chatRoom.messages.length - 1].text.length > 30
                        ? `${chatRoom.messages[chatRoom.messages.length - 1].text.substring(0, 30)}...`
                        : chatRoom.messages[chatRoom.messages.length - 1].text
                      : '메시지가 없습니다'}
                  </div>
                </div>
              </div>
              
              <div className={styles.chatRoomActions}>
                <div className={styles.conversationMeta}>
                  <span className={styles.timestamp}>
                    {formatDate(chatRoom.updated_at || chatRoom.created_at)}
                  </span>
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDeleteChatRoom(chatRoom.room_id, e)}
                  title="채팅방 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;