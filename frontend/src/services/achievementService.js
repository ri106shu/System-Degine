import axiosInstance from './axiosInstance';

const getAchievements = async () => {
  const { data } = await axiosInstance.get('/achievements');
  return data.data.achievements;
};

const getStats = async () => {
  const { data } = await axiosInstance.get('/achievements/stats');
  return data.data;
};

export default { getAchievements, getStats };
