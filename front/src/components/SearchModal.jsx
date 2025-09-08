import { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import styles from './SearchModal.module.css';
import { searchConversations } from '../api/conversation';
import { searchRAG } from '../api/rag';

const SearchModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 통합 검색 함수
  const performSearch = async () => {
    if (!query.trim()) {
      alert('검색 쿼리를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // 대화 검색과 RAG 검색을 병렬로 수행
      const [conversationResults, ragResults] = await Promise.allSettled([
        searchConversations(query, topK),
        searchRAG(query, topK, null, 0.4) // threshold 0.4 적용
      ]);

      const results = {
        query,
        conversations: conversationResults.status === 'fulfilled' ? conversationResults.value : { results: [] },
        rag: ragResults.status === 'fulfilled' ? ragResults.value : { results: [] }
      };

      setResults(results);
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
          <h3 className={styles.title}>DB검색</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* 검색 입력 영역 */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>DB검색</h4>
            <p className={styles.modeDescription}>저장된 대화와 RAG 문서를 검색합니다.</p>

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
                <span className={styles.resultCount}>
                  대화: {results.conversations?.results?.length || 0}개, 
                  RAG: {results.rag?.results?.length || 0}개
                </span>
              </div>

              {/* 쿼리 정보 */}
              <div className={styles.queryInfo}>
                <strong>검색 쿼리:</strong> {query}
              </div>

              {/* 대화 검색 결과 */}
              {results.conversations?.results?.length > 0 && (
                <div className={styles.resultCategory}>
                  <h5>💬 대화 검색 결과</h5>
                  <div className={styles.resultsList}>
                    {results.conversations.results.map((result, index) => (
                      <div key={`conv-${index}`} className={styles.resultItem}>
                        <div className={styles.resultContent}>
                          <div className={styles.resultInfo}>
                            <div className={styles.resultMeta}>
                              <span className={styles.score}>스코어: {(result.score * 100).toFixed(1)}%</span>
                              <span className={styles.contentType}>대화</span>
                            </div>
                            <div className={styles.conversationQuestion}>
                              <strong>Q:</strong> {result.question}
                            </div>
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
                            <div className={styles.conversationAnswer}>
                              <strong>A:</strong> {result.answer}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RAG 검색 결과 */}
              {results.rag?.results?.length > 0 && (
                <div className={styles.resultCategory}>
                  <h5>📄 RAG 문서 검색 결과</h5>
                  <div className={styles.resultsList}>
                    {results.rag.results.map((result, index) => (
                      <div key={`rag-${index}`} className={styles.resultItem}>
                        <div className={styles.resultContent}>
                          <div className={styles.resultInfo}>
                            <div className={styles.resultMeta}>
                              <span className={styles.score}>스코어: {(result.score * 100).toFixed(1)}%</span>
                              <span className={styles.contentType}>{result.content_type}</span>
                            </div>
                            {result.text_content && (
                              <div className={styles.textContent}>
                                <strong>텍스트:</strong> {result.text_content}
                              </div>
                            )}
                            {result.image_path && (
                              <div className={styles.imagePreview}>
                                <strong>이미지:</strong>
                                <img
                                  src={`http://localhost:8000/uploads/${result.image_path.split('/').pop()}`}
                                  alt='RAG 문서 이미지'
                                  className={styles.ragImagePreview}
                                  onError={(e) => {
                                    console.error('Error loading RAG image');
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 결과가 없는 경우 */}
              {(!results.conversations?.results?.length && !results.rag?.results?.length) && (
                <div className={styles.noResults}>검색 결과가 없습니다.</div>
              )}
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
