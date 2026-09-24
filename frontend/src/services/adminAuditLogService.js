import axiosInstance from './axiosInstance';

const getAuditLog = async (params) => {
  const { data } = await axiosInstance.get('/admin/audit-log', { params });
  return data.data;
};

export default { getAuditLog };
