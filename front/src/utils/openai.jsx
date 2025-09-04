export const callOpenAI = async (message, apiKey, videoFile, capturedFrame) => {
  try {
    const messages = [
      {
        role: 'system',
        content: `당신은 비디오 분석 전문 AI입니다. 사용자가 업로드한 영상에 대해 질문하면 도움이 되는 답변을 해주세요. 현재 업로드된 영상: ${videoFile ? videoFile.name : '없음'}${capturedFrame ? '. 현재 일시정지된 화면의 스크린샷이 함께 제공됩니다.' : ''}`,
      },
    ];

    // 캡처된 프레임이 있으면 이미지와 함께 메시지 구성
    if (capturedFrame) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message,
          },
          {
            type: 'image_url',
            image_url: {
              url: capturedFrame,
              detail: 'high',
            },
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: message,
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // gpt-4o-mini로 변경 (이미지도 지원하면서 더 저렴)
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    return '죄송합니다. API 호출 중 오류가 발생했습니다. API 키를 확인해주세요.';
  }
};

export const captureVideoFrame = (videoRef, videoUrl) => {
  if (!videoRef.current || !videoUrl) {
    console.log('비디오가 없음');
    return null;
  }

  try {
    const video = videoRef.current;

    // 비디오가 로드되지 않았거나 크기가 0인 경우
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('비디오 크기가 0임');
      return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 스크린샷 크기 (더 작게 설정)
    const maxWidth = 512;
    const maxHeight = 512;
    let { videoWidth, videoHeight } = video;

    // 비율 유지하면서 크기 조정
    if (videoWidth > maxWidth || videoHeight > maxHeight) {
      const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
      videoWidth *= ratio;
      videoHeight *= ratio;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // 현재 프레임의 단일 이미지만 캡처
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    // 단일 이미지를 base64로 변환
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    console.log('단일 스크린샷 캡처 완료, 크기:', Math.round(dataUrl.length / 1024), 'KB');
    return dataUrl;
  } catch (error) {
    console.error('스크린샷 캡처 오류:', error);
    return null;
  }
};
