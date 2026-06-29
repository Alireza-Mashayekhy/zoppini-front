import { create } from 'zustand';

import { UserResponse } from '@/services/features/users/types';

type AuthStore = {
  user: UserResponse | null;
  setUser: (user: UserResponse | null) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthStore>(set => ({
  user: null,

  setUser: user =>
    set({
      user,
    }),

  clearUser: () =>
    set({
      user: null,
    }),
}));
