// 영상 시간을 포맷팅
export const formatVideoTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 같은 시간대의 채팅방 찾기 (초 단위로 비교)
export const findChatRoomByTime = (chatRooms, videoCurrentTime) => {
  const targetTime = Math.floor(videoCurrentTime);
  return chatRooms.find((room) => room.videoCurrentTime !== null && Math.floor(room.videoCurrentTime) === targetTime);
};

// 새 채팅방 생성 (영상 시간 기반)
export const createNewChatRoom = (capturedFrame, frameTime, videoCurrentTime) => {
  return {
    id: Date.now(),
    name: `${formatVideoTime(videoCurrentTime)}`,
    messages: [
      {
        id: 1,
        text: '이 화면에 대해 궁금한 것이 있으시면 언제든 물어보세요!',
        sender: 'ai',
        timestamp: new Date(),
      },
    ],
    capturedFrame,
    frameTime,
    videoCurrentTime,
  };
};

// 채팅방 찾기 또는 생성
export const findOrCreateChatRoom = (chatRooms, capturedFrame, frameTime, videoCurrentTime) => {
  // 먼저 같은 시간대의 채팅방이 있는지 확인
  const existingRoom = findChatRoomByTime(chatRooms, videoCurrentTime);

  if (existingRoom) {
    return { room: existingRoom, isNew: false };
  }

  // 없으면 새로 생성
  const newRoom = createNewChatRoom(capturedFrame, frameTime, videoCurrentTime);
  return { room: newRoom, isNew: true };
};

// 현재 채팅방 가져오기
export const getCurrentChatRoom = (chatRooms, currentChatRoomId) => {
  return chatRooms.find((room) => room.id === currentChatRoomId);
};

// 채팅방에 메시지 추가
export const addMessageToChatRoom = (chatRooms, roomId, message) => {
  return chatRooms.map((room) => (room.id === roomId ? { ...room, messages: [...room.messages, message] } : room));
};

// 채팅방 삭제
export const deleteChatRoomById = (chatRooms, roomId) => {
  return chatRooms.filter((room) => room.id !== roomId);
};
