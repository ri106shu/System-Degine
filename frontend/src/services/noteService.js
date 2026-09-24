import axiosInstance from './axiosInstance';

const getNotes = async (params) => {
  const { data } = await axiosInstance.get('/notes', { params });
  return data.data.notes;
};
const getNote = async (id) => {
  const { data } = await axiosInstance.get(`/notes/${id}`);
  return data.data.note;
};
const getNoteForTarget = async (targetType, targetId) => {
  const { data } = await axiosInstance.get(`/notes/target/${targetType}/${targetId}`);
  return data.data.note;
};
const createNote = async (payload) => {
  const { data } = await axiosInstance.post('/notes', payload);
  return data.data.note;
};
const updateNote = async (id, payload) => {
  const { data } = await axiosInstance.patch(`/notes/${id}`, payload);
  return data.data.note;
};
const deleteNote = async (id) => {
  await axiosInstance.delete(`/notes/${id}`);
};

export default { getNotes, getNote, getNoteForTarget, createNote, updateNote, deleteNote };
