import axiosInstance from './axiosInstance';

const getTopics = async (params = {}) => {
  const { data } = await axiosInstance.get('/topics', { params });
  return data.data;
};

const createTopic = async (payload) => {
  const { data } = await axiosInstance.post('/topics', payload);
  return data.data;
};

const deleteTopic = async (id) => {
  const { data } = await axiosInstance.delete(`/topics/${id}`);
  return data.data;
};

export default { getTopics, createTopic, deleteTopic };
