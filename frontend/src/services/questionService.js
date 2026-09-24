import axiosInstance from './axiosInstance';

const getQuestions = async (params = {}) => {
  const { data } = await axiosInstance.get('/questions', { params });
  return data.data;
};

const createQuestion = async (payload) => {
  const { data } = await axiosInstance.post('/questions', payload);
  return data.data;
};

const deleteQuestion = async (id) => {
  const { data } = await axiosInstance.delete(`/questions/${id}`);
  return data.data;
};

export default { getQuestions, createQuestion, deleteQuestion };
