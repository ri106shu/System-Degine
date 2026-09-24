import axiosInstance from './axiosInstance';

const getSettings = async () => {
  const { data } = await axiosInstance.get('/admin/settings');
  return data.data.settings;
};
const updatePlatform = async (payload) => {
  const { data } = await axiosInstance.patch('/admin/settings/platform', payload);
  return data.data.settings;
};
const updateModules = async (payload) => {
  const { data } = await axiosInstance.patch('/admin/settings/modules', payload);
  return data.data.settings;
};
const changePassword = async (payload) => {
  const { data } = await axiosInstance.patch('/admin/settings/password', payload);
  return data.data;
};
const getDatabaseStats = async () => {
  const { data } = await axiosInstance.get('/admin/settings/database-stats');
  return data.data.stats;
};
const resetSettings = async () => {
  const { data } = await axiosInstance.post('/admin/settings/reset');
  return data.data.settings;
};

export default { getSettings, updatePlatform, updateModules, changePassword, getDatabaseStats, resetSettings };
