import axiosInstance from './axiosInstance';

const getList = async (params) => {
  const { data } = await axiosInstance.get('/admin/mock-interviews', { params });
  return data.data;
};
const getSummary = async (params) => {
  const { data } = await axiosInstance.get('/admin/mock-interviews/summary', { params });
  return data.data.summary;
};
const getDetail = async (id) => {
  const { data } = await axiosInstance.get(`/admin/mock-interviews/${id}`);
  return data.data.interview;
};
const deleteInterview = async (id) => {
  await axiosInstance.delete(`/admin/mock-interviews/${id}`);
};
const deleteAll = async (params) => {
  const { data } = await axiosInstance.delete('/admin/mock-interviews', { params });
  return data.data;
};

export default { getList, getSummary, getDetail, deleteInterview, deleteAll };
