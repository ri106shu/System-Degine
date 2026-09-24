import axiosInstance from './axiosInstance';

const getRoadmaps = async (moduleSlug) => {
  const { data } = await axiosInstance.get('/roadmaps', { params: { module: moduleSlug } });
  return data.data.roadmaps;
};

const getRoadmapDetail = async (roadmapId) => {
  const { data } = await axiosInstance.get(`/roadmaps/${roadmapId}`);
  return data.data;
};

export default { getRoadmaps, getRoadmapDetail };
