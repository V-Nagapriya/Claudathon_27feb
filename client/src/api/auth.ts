import api from './client';
import { User } from '../types';

export const authApi = {
  login(username: string, password: string) {
    return api.post<{ message: string; user: User }>('/auth/login', { username, password });
  },
  logout() {
    return api.post('/auth/logout');
  },
  me() {
    return api.get<{ user: User }>('/auth/me');
  },
};
