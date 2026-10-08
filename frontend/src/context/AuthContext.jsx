import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('healix_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('healix_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then((res) => {
          if (res.data.success) {
            const userData = {
              username: res.data.username,
              role: res.data.role,
              hospital_id: res.data.hospital_id,
              hospital_name: res.data.hospital_name,
              location: res.data.location,
            };
            setUser(userData);
            localStorage.setItem('healix_user', JSON.stringify(userData));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await authAPI.login(username, password);
    if (res.data.success) {
      const userObj = {
        username: res.data.username,
        role: res.data.role,
        hospital_id: res.data.hospital_id,
        hospital_name: res.data.hospital_name,
        location: res.data.location,
      };
      setToken(res.data.token);
      setUser(userObj);
      localStorage.setItem('healix_token', res.data.token);
      localStorage.setItem('healix_user', JSON.stringify(userObj));
      return userObj;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('healix_token');
    localStorage.removeItem('healix_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isHospital: user?.role === 'hospital',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
