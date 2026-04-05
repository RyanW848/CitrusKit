import { createContext, useState, useEffect } from 'react';
import client from '../api/citrusClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    client.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      });
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await client.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await client.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};