import axiosInstance from './axiosInstance';

const getTopics = async (params) => {
  const { data } = await axiosInstance.get('/admin/topics', { params });
  return data.data;
};

const createTopic = async (payload) => {
  const { data } = await axiosInstance.post('/admin/topics', payload);
  return data.data.topic;
};

const updateTopic = async (id, payload) => {
  const { data } = await axiosInstance.patch(`/admin/topics/${id}`, payload);
  return data.data.topic;
};

const deleteTopic = async (id) => {
  const { data } = await axiosInstance.delete(`/admin/topics/${id}`);
  return data.data.topic;
};

const restoreTopic = async (id) => {
  const { data } = await axiosInstance.post(`/admin/topics/${id}/restore`);
  return data.data.topic;
};

export default { getTopics, createTopic, updateTopic, deleteTopic, restoreTopic };
