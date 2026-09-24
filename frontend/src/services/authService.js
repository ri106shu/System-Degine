import axiosInstance from './axiosInstance';

const register = async (payload) => {
  const { data } = await axiosInstance.post('/auth/register', payload);
  return data.data;
};

const login = async (payload) => {
  const { data } = await axiosInstance.post('/auth/login', payload);
  return data.data;
};

const logout = async () => {
  const { data } = await axiosInstance.post('/auth/logout');
  return data.data;
};

const getMe = async () => {
  const { data } = await axiosInstance.get('/auth/me');
  return data.data;
};

export default { register, login, logout, getMe };
