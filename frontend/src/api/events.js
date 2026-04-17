import client from './client';

export const eventsApi = {
  // Получить список публичных мероприятий (Афиша) - исправлен путь к /public
  getPublicEvents: async () => {
    const response = await client.get('/events/public');
    return response.data;
  },

  // Создать новое мероприятие
  createEvent: async (eventData) => {
    const response = await client.post('/events/', eventData);
    return response.data;
  },

  // Получить мои мероприятия (созданные мной)
  getMyEvents: async () => {
    const response = await client.get('/events/my');
    return response.data;
  },

  // Получить мероприятие по ID
  getEventById: async (id) => {
    const response = await client.get(`/events/${id}`);
    return response.data;
  },

  // Получить мероприятие по коду приглашения
  getEventByInvite: async (code) => {
    const response = await client.get(`/events/invite/${code}`);
    return response.data;
  },

  // Присоединиться к мероприятию по коду
  joinEvent: async (code) => {
    const response = await client.post(`/events/join/${code}`);
    return response.data;
  },

  // Администратор: получить список ожидающих модерации
  getPendingEvents: async () => {
    const response = await client.get('/admin/events/pending');
    return response.data;
  },

  // Администратор: одобрить мероприятие - исправлено на PUT
  approveEvent: async (id) => {
    const response = await client.put(`/admin/events/${id}/approve`);
    return response.data;
  },

  // Администратор: отклонить мероприятие - исправлено на PUT
  rejectEvent: async (id) => {
    const response = await client.put(`/admin/events/${id}/reject`);
    return response.data;
  }
};
