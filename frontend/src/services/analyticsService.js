import axiosInstance from './axiosInstance';

const getAnalytics = async ({ module, range }) => {
  const { data } = await axiosInstance.get('/analytics', { params: { module, range } });
  return data.data;
};

export default { getAnalytics };
