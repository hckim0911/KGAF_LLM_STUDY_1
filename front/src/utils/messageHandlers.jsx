import { callOpenAI } from './openai';
import { getCurrentChatRoom, addMessageToChatRoom } from './chatRoomManager';
import { saveChatRoom } from '../api/chat';
import { saveConversation } from '../api/conversation';
import { saveApiKey } from '../api/auth';

// 메시지 전송 핸들러
export const createSendMessageHandler = (
  inputMessage,
  setInputMessage,
  chatRooms,
  setChatRooms,
  currentChatRoomId,
  isApiKeySet,
  videoFile,
  videoId,
  setIsLoading,
  onConversationSaved = null
) => {
  return async () => {
    if (inputMessage.trim() === '' || !currentChatRoomId) {
      return;
    }

    const currentRoom = getCurrentChatRoom(chatRooms, currentChatRoomId);
    if (!currentRoom) {
      return;
    }

    const newMessage = {
      id: currentRoom.messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    const roomToSaveAfterUser = {
      ...currentRoom,
      messages: [...currentRoom.messages, newMessage],
    };

    // 현재 채팅방에 사용자 메시지 추가
    setChatRooms((prev) => addMessageToChatRoom(prev, currentChatRoomId, newMessage));

    try {
      await saveChatRoom(roomToSaveAfterUser, videoId);
      console.log('Chat room saved after user message');
    } catch (error) {
      console.error('Failed to save chat room after user message:', error);
    }

    const currentMessage = inputMessage;
    setInputMessage('');

    if (isApiKeySet) {
      setIsLoading(true);
      try {
        const aiResponse = await callOpenAI(currentMessage, videoFile, currentRoom.capturedFrame);

        const responseMessage = {
          id: currentRoom.messages.length + 2,
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
        };

        setChatRooms((prev) => addMessageToChatRoom(prev, currentChatRoomId, responseMessage));

        const roomToSaveAfterAI = {
          ...roomToSaveAfterUser,
          messages: [...roomToSaveAfterUser.messages, responseMessage],
        };
        try {
          await saveChatRoom(roomToSaveAfterAI, videoId);
          console.log('Chat room saved after AI message');
        } catch (error) {
          console.error('Failed to save chat room to backend:', error);
        }

        try {
          await saveConversation(
            currentMessage, // question
            aiResponse, // answer
            currentRoom.capturedFrame, // question_image
            currentRoom.videoCurrentTime, // timestamp
            videoId // video_id for shared frame storage
          );
          console.log('✅ Conversation saved successfully - now searchable!');
          
          // 대화 저장 성공 시 ConversationHistory 새로고침 트리거
          if (onConversationSaved) {
            onConversationSaved();
          }
        } catch (error) {
          console.error('❌ Failed to save conversation to backend:', error);
        }
      } catch (error) {
        const errorMessage = {
          id: currentRoom.messages.length + 2,
          text: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
          sender: 'ai',
          timestamp: new Date(),
        };
        setChatRooms((prev) => addMessageToChatRoom(prev, currentChatRoomId, errorMessage));
      }
      setIsLoading(false);
    } else {
      // API 키가 설정되지 않은 경우
      setTimeout(() => {
        const aiResponse = {
          id: currentRoom.messages.length + 2,
          text: 'OpenAI API 키를 입력해주세요. 그래야 영상에 대한 질문에 답변할 수 있습니다.',
          sender: 'ai',
          timestamp: new Date(),
        };
        setChatRooms((prev) => addMessageToChatRoom(prev, currentChatRoomId, aiResponse));
      }, 500);
    }
  };
};

// 키보드 입력 핸들러
export const createKeyPressHandler = (sendMessageHandler) => {
  return (e) => {
    if (e.key === 'Enter') {
      sendMessageHandler();
    }
  };
};

// API 키 제출 핸들러
export const createApiKeySubmitHandler = (apiKey, setIsApiKeySet, chatRooms, setChatRooms, currentChatRoomId) => {
  return async () => {
    if (apiKey.trim()) {
      try {
        // 백엔드에 API 키 저장
        await saveApiKey(apiKey);
        setIsApiKeySet(true);

        // 현재 채팅방이 있는 경우에만 메시지 추가
        if (currentChatRoomId && chatRooms.length > 0) {
          const currentRoom = getCurrentChatRoom(chatRooms, currentChatRoomId);
          if (currentRoom) {
            const welcomeMessage = {
              id: currentRoom.messages.length + 1,
              text: 'OpenAI API가 연결되었습니다! 이제 영상에 대해 더 정확한 답변을 드릴 수 있습니다.',
              sender: 'ai',
              timestamp: new Date(),
            };

            setChatRooms((prev) => addMessageToChatRoom(prev, currentChatRoomId, welcomeMessage));
          }
        }
        // 채팅방이 없는 경우에는 메시지를 추가하지 않음 (초기 상태)
      } catch (error) {
        console.error('Failed to save API key:', error);
        alert('API 키 저장에 실패했습니다.');
      }
    }
  };
};
