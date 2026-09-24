import axiosInstance from './axiosInstance';

const getQuestions = async (params) => {
  const { data } = await axiosInstance.get('/admin/questions', { params });
  return data.data;
};
const createQuestion = async (payload) => {
  const { data } = await axiosInstance.post('/admin/questions', payload);
  return data.data.question;
};
const updateQuestion = async (id, payload) => {
  const { data } = await axiosInstance.patch(`/admin/questions/${id}`, payload);
  return data.data.question;
};
const deleteQuestion = async (id) => {
  const { data } = await axiosInstance.delete(`/admin/questions/${id}`);
  return data.data.question;
};
const restoreQuestion = async (id) => {
  const { data } = await axiosInstance.post(`/admin/questions/${id}/restore`);
  return data.data.question;
};

export default { getQuestions, createQuestion, updateQuestion, deleteQuestion, restoreQuestion };
