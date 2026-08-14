import api from './api';

export const getConversations = async (params) => {
    const response = await api.get('/messages/conversations', { params });
    return response.data;
};

export const getConversationById = async (id) => {
    const response = await api.get(`/messages/conversations/${id}`);
    return response.data;
};

export const createConversation = async (participantIds) => {
    const response = await api.post('/messages/conversations', { participantIds });
    return response.data;
};

export const sendMessage = async (conversationId, content) => {
    const response = await api.post(`/messages/conversations/${conversationId}`, { content });
    return response.data;
};

export const markMessageRead = async (messageId) => {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data;
};
