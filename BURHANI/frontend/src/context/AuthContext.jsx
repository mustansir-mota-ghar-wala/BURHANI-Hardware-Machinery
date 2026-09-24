import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);  // null = loading, false = not logged in
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiGet('/api/react/user/');
      if (data && (data.is_authenticated || data.username)) {
        setUser({
          is_authenticated: true,
          username: data.username,
          first_name: data.first_name,
          is_staff: Boolean(data.is_staff),
          is_superuser: Boolean(data.is_superuser),
          is_owner: Boolean(data.is_owner),
        });
        setCartCount(data.cart_count || 0);
      } else {
        setUser(false);
        setCartCount(0);
      }
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const logout = async () => {
    try {
      await apiPost('/api/react/logout/');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(false);
      setCartCount(0);
    }
  };

  return (
    <AuthContext.Provider value={{ user, cartCount, setCartCount, loading, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
