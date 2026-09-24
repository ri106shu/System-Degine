import axiosInstance from './axiosInstance';

const getByModule = async (moduleSlug) => {
  const { data } = await axiosInstance.get(`/admin/roadmaps/module/${moduleSlug}`);
  return data.data;
};
const createRoadmap = async (moduleSlug, payload) => {
  const { data } = await axiosInstance.post(`/admin/roadmaps/module/${moduleSlug}`, payload);
  return data.data;
};
const updateRoadmap = async (id, payload) => {
  const { data } = await axiosInstance.patch(`/admin/roadmaps/${id}`, payload);
  return data.data;
};
const toggleActive = async (id, isActive) => {
  const { data } = await axiosInstance.patch(`/admin/roadmaps/${id}/active`, { isActive });
  return data.data;
};
const duplicateRoadmap = async (id) => {
  const { data } = await axiosInstance.post(`/admin/roadmaps/${id}/duplicate`);
  return data.data;
};

const createWeek = async (roadmapId, payload) => {
  const { data } = await axiosInstance.post(`/admin/roadmaps/${roadmapId}/weeks`, payload);
  return data.data.week;
};
const updateWeek = async (weekId, payload) => {
  const { data } = await axiosInstance.patch(`/admin/roadmap-weeks/${weekId}`, payload);
  return data.data.week;
};
const deleteWeek = async (weekId) => {
  const { data } = await axiosInstance.delete(`/admin/roadmap-weeks/${weekId}`);
  return data.data;
};
const moveWeek = async (weekId, direction) => {
  const { data } = await axiosInstance.patch(`/admin/roadmap-weeks/${weekId}/move`, { direction });
  return data.data.week;
};

const createDay = async (weekId, payload) => {
  const { data } = await axiosInstance.post(`/admin/roadmap-weeks/${weekId}/days`, payload);
  return data.data.day;
};
const updateDay = async (dayId, payload) => {
  const { data } = await axiosInstance.patch(`/admin/roadmap-days/${dayId}`, payload);
  return data.data.day;
};
const deleteDay = async (dayId) => {
  const { data } = await axiosInstance.delete(`/admin/roadmap-days/${dayId}`);
  return data.data;
};
const moveDay = async (dayId, direction) => {
  const { data } = await axiosInstance.patch(`/admin/roadmap-days/${dayId}/move`, { direction });
  return data.data.day;
};

export default {
  getByModule, createRoadmap, updateRoadmap, toggleActive, duplicateRoadmap,
  createWeek, updateWeek, deleteWeek, moveWeek,
  createDay, updateDay, deleteDay, moveDay,
};
