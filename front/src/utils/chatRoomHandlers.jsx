import { deleteChatRoomById } from './chatRoomManager';

// 채팅방 전환 핸들러
export const createSwitchChatRoomHandler = (setCurrentChatRoomId, setShowChatRoomList) => {
  return (roomId) => {
    setCurrentChatRoomId(roomId);
    setShowChatRoomList(false);
  };
};

// 채팅방 삭제 핸들러
export const createDeleteChatRoomHandler = (chatRooms, setChatRooms, currentChatRoomId, setCurrentChatRoomId) => {
  return (roomId) => {
    // 삭제 후 남은 채팅방들 계산
    const remainingRooms = chatRooms.filter((room) => room.id !== roomId);

    // 채팅방 목록에서 삭제
    setChatRooms((prev) => deleteChatRoomById(prev, roomId));

    if (currentChatRoomId === roomId) {
      // 삭제한 채팅방이 현재 채팅방인 경우
      if (remainingRooms.length > 0) {
        // 다른 채팅방이 있으면 첫 번째 채팅방으로 이동
        setCurrentChatRoomId(remainingRooms[0].id);
      } else {
        // 모든 채팅방이 삭제되면 빈 상태로 이동
        setCurrentChatRoomId(null);
      }
    }
  };
};
