import { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import styles from './SearchModal.module.css';
import { searchConversations } from '../api/conversation';

const SearchModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // API 호출 함수
  const performSearch = async () => {
    if (!query.trim()) {
      alert('검색 쿼리를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await searchConversations(query, topK);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('검색 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Conversation Search Test</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* 검색 입력 영역 */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>대화 검색</h4>
            <p className={styles.modeDescription}>저장된 대화(질문/답변)를 검색합니다.</p>

            {/* 텍스트 입력 */}
            <div className={styles.inputGroup}>
              <label htmlFor='search-query' className={styles.label}>
                검색 쿼리
              </label>
              <input
                id='search-query'
                type='text'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='검색할 내용을 입력하세요...'
                className={styles.input}
              />
            </div>

            {/* Top-K 설정 */}
            <div className={styles.inputGroup}>
              <label htmlFor='top-k-input' className={styles.label}>
                결과 개수 (Top-K)
              </label>
              <input
                id='top-k-input'
                type='number'
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                min='1'
                max='20'
                className={styles.numberInput}
              />
            </div>

            {/* 검색 버튼 */}
            <button
              onClick={performSearch}
              disabled={isLoading}
              className={`${styles.searchButton} ${isLoading ? styles.loading : ''}`}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  검색 중...
                </>
              ) : (
                <>
                  <Search size={16} />
                  대화 검색
                </>
              )}
            </button>
          </div>

          {/* 에러 표시 */}
          {error && (
            <div className={styles.error}>
              <p className={styles.errorTitle}>오류 발생:</p>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}

          {/* 검색 결과 */}
          {results && (
            <div className={styles.section}>
              <div className={styles.resultHeader}>
                <h4 className={styles.sectionTitle}>검색 결과</h4>
                <span className={styles.resultCount}>총 {results.results?.length || 0}개 결과</span>
              </div>

              {/* 쿼리 정보 */}
              <div className={styles.queryInfo}>
                <strong>검색 쿼리:</strong> {query}
              </div>

              {/* 결과 목록 */}
              <div className={styles.resultsList}>
                {results.results?.map((result, index) => (
                  <div key={index} className={styles.resultItem}>
                    <div className={styles.resultContent}>
                      {/* 대화 검색 결과 표시 */}
                      <div className={styles.resultInfo}>
                        <div className={styles.resultMeta}>
                          <span className={styles.score}>스코어: {(result.score * 100).toFixed(1)}%</span>
                          <span className={styles.contentType}>대화</span>
                        </div>

                        {/* 질문 */}
                        <div className={styles.conversationQuestion}>
                          <strong>Q:</strong> {result.question}
                        </div>

                        {/* 질문 이미지가 있으면 표시 */}
                        {result.question_image && (
                          <div className={styles.questionImage}>
                            <img
                              src={result.question_image}
                              alt='질문 관련 이미지'
                              className={styles.conversationImagePreview}
                              onError={(e) => {
                                console.error('Error loading conversation image');
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {/* 답변 */}
                        <div className={styles.conversationAnswer}>
                          <strong>A:</strong> {result.answer}
                        </div>

                        {/* 메타데이터 */}
                        {result.metadata && (
                          <div className={styles.metadata}>
                            {result.metadata.timestamp && (
                              <p>
                                <strong>타임스탬프:</strong> {result.metadata.timestamp}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 결과가 없는 경우 */}
              {results.results?.length === 0 && <div className={styles.noResults}>검색 결과가 없습니다.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

SearchModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SearchModal;
