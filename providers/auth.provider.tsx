'use client';

import { useEffect } from 'react';

import { UserResponse } from '@/services/features/auth/types';
import { useAuthStore } from '@/store/auth.store';

type Props = {
  children: React.ReactNode;
  initialUser: UserResponse | UserResponse[] | null;
};

export default function AuthProvider({ children, initialUser }: Props) {
  const setUser = useAuthStore(state => state.setUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser, setUser]);

  return children;
}
