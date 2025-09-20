import api from '../client';

// 채팅방 저장
export const saveChatRoom = async (chatRoom, videoId) => {
  if (!videoId) {
    return { skipped: true };
  }

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
