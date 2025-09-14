import axiosInstance from './axiosInstance';

export const searchRAG = async (query, topK = 10, contentType = null, threshold = 0.4) => {
  const formData = new FormData();
  formData.append('query', query);
  formData.append('top_k', topK.toString());
  formData.append('threshold', threshold.toString());
  if (contentType) {
    formData.append('content_type', contentType);
  }

  const response = await axiosInstance.post('/search/text', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const ingestText = async (text, metadata = {}) => {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await axiosInstance.post('/ingest/text', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const ingestImage = async (file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await axiosInstance.post('/ingest/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};