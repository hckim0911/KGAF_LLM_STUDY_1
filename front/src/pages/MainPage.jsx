import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../utils/authContext';
import { getApiKeyStatus } from '../api/users';
import VideoPlayer from '../components/VideoPlayer';
import ChatSection from '../components/ChatSection';
import ChatRoomList from '../components/ChatRoomList';
import ApiKeyModal from '../components/ApiKeyModal';
import IntroSection from '../components/IntroSection';
import SearchModal from '../components/SearchModal';
import ConversationHistory from '../components/ConversationHistory';
import { getCurrentChatRoom } from '../utils/chatRoomManager';
import {
  createVideoToggleHandler,
  createFileUploadHandler,
  createUploadClickHandler,
  createVideoPauseHandler,
  createVideoPlayHandler,
  createVideoSeekingHandler,
  createVideoSeekedHandler,
} from '../utils/videoHandlers';
import { createSendMessageHandler, createKeyPressHandler, createApiKeySubmitHandler } from '../utils/messageHandlers';
import { createSwitchChatRoomHandler, createDeleteChatRoomHandler } from '../utils/chatRoomHandlers';
import styles from './MainPage.module.css';
import MainPageHeader from '../components/MainPageHeader';

function MainPage() {
  const { user } = useAuth();
  
  // 상태 관리
  const [chatRooms, setChatRooms] = useState([]);
  const [currentChatRoomId, setCurrentChatRoomId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showChatRoomList, setShowChatRoomList] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationHistoryRefresh, setConversationHistoryRefresh] = useState(0);
  
  // 로그인 후 API 키 상태 확인 및 기본 채팅방 생성
  useEffect(() => {
    const checkApiKeyStatus = async () => {
      if (user) {
        try {
          const status = await getApiKeyStatus();
          if (status.has_api_key && status.api_key_validated) {
            setIsApiKeySet(true);
            console.log('저장된 API 키가 있습니다.');
          }
        } catch (error) {
          console.error('Failed to check API key status:', error);
        }
      }
    };
    
    // 기본 채팅방 생성 (로그인 후)
    const createDefaultChatRoom = () => {
      if (user && chatRooms.length === 0) {
        const defaultRoomId = Date.now().toString();
        const defaultRoom = {
          id: defaultRoomId,
          name: '기본 채팅',
          messages: [],
          capturedFrame: null,
          videoCurrentTime: 0,
          timestamp: new Date(),
        };
        setChatRooms([defaultRoom]);
        setCurrentChatRoomId(defaultRoomId);
      }
    };
    
    checkApiKeyStatus();
    createDefaultChatRoom();
  }, [user, chatRooms.length]);

  // refs
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // 핸들러 생성
  const handleVideoToggle = createVideoToggleHandler(
    videoRef,
    videoUrl,
    videoId,
    isPlaying,
    setIsPlaying,
    chatRooms,
    setChatRooms,
    setCurrentChatRoomId
  );

  const handleFileUpload = createFileUploadHandler(
    setVideoFile,
    setVideoUrl,
    setVideoId,
    setIsPlaying,
    setChatRooms,
    setCurrentChatRoomId,
    videoUrl,
    videoRef
  );

  const handleUploadClick = createUploadClickHandler(fileInputRef);

  const handleVideoPlay = createVideoPlayHandler(setIsPlaying);

  const handleVideoPause = createVideoPauseHandler(
    videoRef,
    videoUrl,
    videoId,
    setIsPlaying,
    chatRooms,
    setChatRooms,
    setCurrentChatRoomId,
    setShowChatRoomList
  );

  const handleVideoSeeking = createVideoSeekingHandler();
  const handleVideoSeeked = createVideoSeekedHandler();

  const handleSendMessage = createSendMessageHandler(
    inputMessage,
    setInputMessage,
    chatRooms,
    setChatRooms,
    currentChatRoomId,
    isApiKeySet,
    videoFile,
    videoId,
    setIsLoading,
    () => setConversationHistoryRefresh(prev => prev + 1)
  );

  const handleKeyPress = createKeyPressHandler(handleSendMessage);

  const openApiKeyModal = () => {
    setApiKey('');
    setShowApiModal(true);
  };

  const handleApiKeySubmit = createApiKeySubmitHandler(
    apiKey,
    setIsApiKeySet,
    chatRooms,
    setChatRooms,
    currentChatRoomId,
    isApiKeySet,
    () => setApiKey('')
  );

  const handleSwitchChatRoom = createSwitchChatRoomHandler(setCurrentChatRoomId, setShowChatRoomList);

  const handleDeleteChatRoom = createDeleteChatRoomHandler(
    chatRooms,
    setChatRooms,
    currentChatRoomId,
    setCurrentChatRoomId
  );

  const handleSelectChatRoom = (selectedChatRoom) => {
    // 선택된 채팅방의 메시지를 현재 채팅방으로 로드
    const currentRoom = getCurrentChatRoom(chatRooms, currentChatRoomId);
    if (currentRoom) {
      // 메시지의 timestamp를 Date 객체로 변환
      const processedMessages = (selectedChatRoom.messages || []).map((message, index) => ({
        ...message,
        id: message.id || Date.now() + index, // ID가 없으면 생성
        timestamp: message.timestamp instanceof Date 
          ? message.timestamp 
          : new Date(message.timestamp || Date.now())
      }));
      
      // 선택된 채팅방의 메시지를 현재 채팅방에 로드
      const updatedRoom = {
        ...currentRoom,
        messages: processedMessages,
        name: selectedChatRoom.name,
        capturedFrame: selectedChatRoom.captured_frame,
        videoCurrentTime: selectedChatRoom.video_current_time || 0,
      };
      
      const updatedChatRooms = chatRooms.map(room => 
        room.id === currentChatRoomId ? updatedRoom : room
      );
      
      setChatRooms(updatedChatRooms);
      setSelectedConversation(selectedChatRoom);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.card}>
          <MainPageHeader
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            onUploadClick={handleUploadClick}
          />
          <VideoPlayer
            videoFile={videoFile}
            videoUrl={videoUrl}
            isPlaying={isPlaying}
            videoRef={videoRef}
            onVideoToggle={handleVideoToggle}
            onVideoPlay={handleVideoPlay}
            onVideoPause={handleVideoPause}
            onVideoSeeking={handleVideoSeeking}
            onVideoSeeked={handleVideoSeeked}
          />
          
          {/* 채팅방 기록을 비디오 플레이어 아래에 표시 */}
          {user && (
            <ConversationHistory 
              onSelectChatRoom={handleSelectChatRoom}
              className={styles.conversationHistorySection}
              refreshTrigger={conversationHistoryRefresh}
            />
          )}
        </div>
      </div>

      {/* 사용자가 로그인했으면 항상 채팅 기능 표시 */}
      {user ? (
        currentChatRoomId ? (
          <>
            <ChatSection
              currentChatRoom={getCurrentChatRoom(chatRooms, currentChatRoomId)}
              chatRooms={chatRooms}
              inputMessage={inputMessage}
              isApiKeySet={isApiKeySet}
              isLoading={isLoading}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              onShowApiModal={openApiKeyModal}
              onShowChatRoomList={() => setShowChatRoomList(true)}
              onShowSearchModal={() => setShowSearchModal(true)}
            />
            {showChatRoomList && (
              <ChatRoomList
                chatRooms={chatRooms}
                currentChatRoomId={currentChatRoomId}
                onSwitchRoom={handleSwitchChatRoom}
                onDeleteRoom={handleDeleteChatRoom}
                onClose={() => setShowChatRoomList(false)}
              />
            )}
          </>
        ) : (
          <div className={styles.loadingChat}>채팅방을 준비 중입니다...</div>
        )
      ) : (
          <IntroSection isApiKeySet={isApiKeySet} onShowApiModal={openApiKeyModal} />
      )}

      {showApiModal && (
        <ApiKeyModal
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onSubmit={handleApiKeySubmit}
          onClose={() => setShowApiModal(false)}
        />
      )}

      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} />}
    </div>
  );
}

export default MainPage;
