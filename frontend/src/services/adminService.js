import axiosInstance from './axiosInstance';

const getDashboard = async () => {
  const { data } = await axiosInstance.get('/admin/dashboard');
  return data.data;
};

export default { getDashboard };
