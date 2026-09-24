import axiosInstance from './axiosInstance';

const getModules = async () => {
  const { data } = await axiosInstance.get('/modules');
  return data.data;
};

export default { getModules };
