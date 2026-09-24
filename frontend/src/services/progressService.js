import axiosInstance from './axiosInstance';

const getTopicProgress = async () => {
  const { data } = await axiosInstance.get('/progress/topics');
  return data.data;
};

const getQuestionProgress = async () => {
  const { data } = await axiosInstance.get('/progress/questions');
  return data.data;
};

const updateTopicProgress = async (topicId, payload) => {
  const { data } = await axiosInstance.patch(`/progress/topic/${topicId}`, payload);
  return data.data;
};

const updateQuestionProgress = async (questionId, payload) => {
  const { data } = await axiosInstance.patch(`/progress/question/${questionId}`, payload);
  return data.data;
};

const updateRoadmapProgress = async (dayId, payload) => {
  const { data } = await axiosInstance.patch(`/progress/roadmap/${dayId}`, payload);
  return data.data;
};

export default { getTopicProgress, getQuestionProgress, updateTopicProgress, updateQuestionProgress, updateRoadmapProgress };
