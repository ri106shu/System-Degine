import axiosInstance from './axiosInstance';

const getEligible = async (mode, type = 'question') => {
  const { data } = await axiosInstance.get('/mocks/eligible', { params: { mode, type } });
  return data.data;
};

const createMock = async (config) => {
  const { data } = await axiosInstance.post('/mocks', config);
  return data.data.mock;
};

const getMockById = async (id) => {
  const { data } = await axiosInstance.get(`/mocks/${id}`);
  return data.data.mock;
};

const submitAnswer = async (id, { questionIndex, answer, timeSpentSeconds }) => {
  const { data } = await axiosInstance.patch(`/mocks/${id}/answer`, { questionIndex, answer, timeSpentSeconds });
  return data.data.mock;
};

const navigateToQuestion = async (id, questionIndex) => {
  const { data } = await axiosInstance.patch(`/mocks/${id}/navigate`, { questionIndex });
  return data.data.mock;
};

const finishMock = async (id, { questionIndex, answer, timeSpentSeconds } = {}) => {
  const { data } = await axiosInstance.post(`/mocks/${id}/finish`, { questionIndex, answer, timeSpentSeconds });
  return data.data;
};

const abandonMock = async (id) => {
  const { data } = await axiosInstance.post(`/mocks/${id}/abandon`);
  return data.data.mock;
};

const getMockHistory = async (params) => {
  const { data } = await axiosInstance.get('/mocks/history', { params });
  return data.data;
};

const deleteMock = async (id) => {
  await axiosInstance.delete(`/mocks/${id}`);
  return id;
};

export default {
  getEligible,
  createMock,
  getMockById,
  submitAnswer,
  navigateToQuestion,
  finishMock,
  abandonMock,
  getMockHistory,
  deleteMock,
};
