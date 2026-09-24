import axiosInstance from './axiosInstance';

const getTiming = async () => {
  const { data } = await axiosInstance.get('/interview-timing');
  return data.data;
};

const updateTiming = async ({ module, type, difficulty, durationMinutes }) => {
  const { data } = await axiosInstance.patch('/interview-timing', { module, type, difficulty, durationMinutes });
  return data.data;
};

const resetTiming = async (module) => {
  const { data } = await axiosInstance.post('/interview-timing/reset', { module });
  return data.data;
};

export default { getTiming, updateTiming, resetTiming };
