import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const logDeviationAPI = async (text, currentDeviation = null) => {
  const response = await api.post('/ai/log-deviation', {
    text,
    current_deviation: currentDeviation,
  });
  return response.data;
};

export const editDeviationAPI = async (instruction, currentDeviation, currentAssessment = null) => {
  const response = await api.post('/ai/edit-deviation', {
    instruction,
    current_deviation: currentDeviation,
    current_assessment: currentAssessment,
  });
  return response.data;
};

export const extractDocumentAPI = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/ai/extract-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const saveDeviationAPI = async (deviationData) => {
  const response = await api.post('/deviations', deviationData);
  return response.data;
};

export const getDeviationsAPI = async () => {
  const response = await api.get('/deviations');
  return response.data;
};

export const getDeviationByIdAPI = async (id) => {
  const response = await api.get(`/deviations/${id}`);
  return response.data;
};

export const getHealthAPI = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
