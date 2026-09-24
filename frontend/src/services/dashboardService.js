import axiosInstance from './axiosInstance';

const getDashboard = async () => {
  const { data } = await axiosInstance.get('/analytics/dashboard');
  return data.data;
};

export default { getDashboard };
