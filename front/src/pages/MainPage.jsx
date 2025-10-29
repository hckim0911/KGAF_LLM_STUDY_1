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
  const [conversationHistoryRefresh, setConversationHistoryRefresh] = useState(0);
  const currentChatRoom = getCurrentChatRoom(chatRooms, currentChatRoomId);

  // 로그인 후 API 키 상태 확인
  useEffect(() => {
    const checkApiKeyStatus = async () => {
      if (!user) {
        setIsApiKeySet(false);
        return;
      }

      try {
        const status = await getApiKeyStatus();
        if (status.has_api_key && status.api_key_validated) {
          setIsApiKeySet(true);
          console.log('저장된 API 키가 있습니다.');
        } else {
          setIsApiKeySet(false);
        }
      } catch (error) {
        console.error('Failed to check API key status:', error);
        setIsApiKeySet(false);
      }
    };

    checkApiKeyStatus();
  }, [user]);

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
    () => setConversationHistoryRefresh((prev) => prev + 1)
  );

  const handleKeyPress = createKeyPressHandler(handleSendMessage);

  const handleApiKeySubmit = createApiKeySubmitHandler(
    apiKey,
    setIsApiKeySet,
    chatRooms,
    setChatRooms,
    currentChatRoomId,
    isApiKeySet,
    () => setApiKey('')
  );

  const openApiKeyModal = () => {
    setApiKey('');
    setShowApiModal(true);
  };

  const handleSwitchChatRoom = createSwitchChatRoomHandler(setCurrentChatRoomId, setShowChatRoomList);

  const handleDeleteChatRoom = createDeleteChatRoomHandler(
    chatRooms,
    setChatRooms,
    currentChatRoomId,
    setCurrentChatRoomId
  );

  const handleSelectChatRoom = (selectedChatRoom) => {
    if (!selectedChatRoom) {
      return;
    }

    const normalizedRoomId = selectedChatRoom.room_id || selectedChatRoom.id || Date.now().toString();

    const processedMessages = (selectedChatRoom.messages || []).map((message, index) => ({
      ...message,
      id: message.id || `${normalizedRoomId}-msg-${index}`,
      timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp || Date.now()),
    }));

    const normalizedRoom = {
      id: normalizedRoomId,
      name: selectedChatRoom.name || '이전 채팅',
      messages: processedMessages,
      capturedFrame: selectedChatRoom.captured_frame || null,
      frameTime: selectedChatRoom.frame_time ? new Date(selectedChatRoom.frame_time) : null,
      videoCurrentTime: selectedChatRoom.video_current_time || 0,
      videoId: selectedChatRoom.video_id || null,
    };

    setChatRooms((prevRooms) => {
      const existingIndex = prevRooms.findIndex((room) => room.id === normalizedRoomId);
      if (existingIndex !== -1) {
        const updated = [...prevRooms];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...normalizedRoom,
        };
        return updated;
      }
      return [...prevRooms, normalizedRoom];
    });

    setVideoId(normalizedRoom.videoId || null);
    setCurrentChatRoomId(normalizedRoomId);
    setShowChatRoomList(false);
  };

  useEffect(() => {
    if (!user) {
      setChatRooms([]);
      setCurrentChatRoomId(null);
      setVideoFile(null);
      setVideoUrl(null);
      setVideoId(null);
      setInputMessage('');
      setShowChatRoomList(false);
      setShowSearchModal(false);
      setIsPlaying(false);
      setShowApiModal(false);
      setApiKey('');
    }
  }, [user]);

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

      {user ? (
        currentChatRoom ? (
          <>
            <ChatSection
              currentChatRoom={currentChatRoom}
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
            {showChatRoomList && currentChatRoom && (
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
          <IntroSection isApiKeySet={isApiKeySet} onShowApiModal={openApiKeyModal} />
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
