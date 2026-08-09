import apiClient from './api';

export const loginRequest = async ({ loginId, password }) => {
  const response = await apiClient.post('/auth/login', { loginId, password });
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const changePasswordRequest = async ({ currentPassword, newPassword }) => {
  const response = await apiClient.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const logoutRequest = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};
