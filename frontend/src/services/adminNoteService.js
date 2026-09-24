import axiosInstance from './axiosInstance';

const getNotes = async (params) => {
  const { data } = await axiosInstance.get('/admin/notes', { params });
  return data.data;
};
const getStats = async () => {
  const { data } = await axiosInstance.get('/admin/notes/stats');
  return data.data.stats;
};
const getNote = async (id) => {
  const { data } = await axiosInstance.get(`/admin/notes/${id}`);
  return data.data.note;
};
const updateNote = async (id, payload) => {
  const { data } = await axiosInstance.patch(`/admin/notes/${id}`, payload);
  return data.data.note;
};
const deleteNote = async (id) => {
  await axiosInstance.delete(`/admin/notes/${id}`);
};

export default { getNotes, getStats, getNote, updateNote, deleteNote };
