import axiosInstance from './axiosInstance';

const getAnalytics = async (range) => {
  const { data } = await axiosInstance.get('/admin/analytics', { params: { range } });
  return data.data;
};

export default { getAnalytics };
