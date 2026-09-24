import axiosInstance from './axiosInstance';

const getPrompts = async (params) => {
  const { data } = await axiosInstance.get('/admin/topic-prompts', { params });
  return data.data;
};
const createPrompt = async (payload) => {
  const { data } = await axiosInstance.post('/admin/topic-prompts', payload);
  return data.data.prompt;
};
const updatePrompt = async (id, payload) => {
  const { data } = await axiosInstance.patch(`/admin/topic-prompts/${id}`, payload);
  return data.data.prompt;
};
const deletePrompt = async (id) => {
  const { data } = await axiosInstance.delete(`/admin/topic-prompts/${id}`);
  return data.data.prompt;
};
const restorePrompt = async (id) => {
  const { data } = await axiosInstance.post(`/admin/topic-prompts/${id}/restore`);
  return data.data.prompt;
};

export default { getPrompts, createPrompt, updatePrompt, deletePrompt, restorePrompt };
