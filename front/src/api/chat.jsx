import api from './axiosInstance';

// 채팅 저장
export const saveChat = async (chatText, timestamp, username = null, metadata = {}) => {
  // Input validation
  if (!chatText || typeof chatText !== 'string') {
    throw new Error(`Invalid chat text: ${typeof chatText} - ${chatText}`);
  }

  if (!chatText.trim()) {
    throw new Error('Chat text cannot be empty');
  }

  const formData = new FormData();
  formData.append('chat_text', chatText.trim());
  formData.append('timestamp', timestamp.toString());
  if (username) {
    formData.append('username', username);
  }
  formData.append('metadata', JSON.stringify(metadata));

  const response = await api.post('/chats/save', formData);
  return response.data;
};

// 채팅방 저장
export const saveChatRoom = async (chatRoom, videoId) => {
  const requestBody = {
    room_id: chatRoom.id.toString(),
    name: chatRoom.name,
    messages: chatRoom.messages,
    captured_frame: chatRoom.capturedFrame,
    frame_time: chatRoom.frameTime ? chatRoom.frameTime.toISOString() : null,
    video_current_time: chatRoom.videoCurrentTime,
    video_id: videoId,
  };

  const response = await api.post('/chatrooms/save', requestBody, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// 비디오별 채팅방 조회
export const getChatRoomsByVideo = async (videoId) => {
  const response = await api.get(`/chatrooms/${videoId}`);
  return response.data;
};

// 모든 채팅방 조회
export const getAllChatRooms = async () => {
  const response = await api.get('/chatrooms');
  return response.data;
};

// 채팅방 삭제
export const deleteChatRoom = async (roomId) => {
  const response = await api.delete(`/chatrooms/${roomId}`);
  return response.data;
};
