import { createContext, useContext, useEffect, useState } from 'react';
import React from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState({
    token: null,
    role: null,
    name: null,
    userId: null,
    hotelId: null,
  });

  const logout = () => {
    localStorage.clear();
    setAuth({
      token: null,
      role: null,
      name: null,
      userId: null,
      hotelId: null,
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const decoded = jwtDecode(token);

      if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
        logout();
        setLoading(false);
        return;
      }

      setAuth({
        token,
        role: localStorage.getItem('role'),
        name: localStorage.getItem('name'),
        userId: Number(localStorage.getItem('userId')),
        hotelId: Number(localStorage.getItem('hotelId')),
      });

    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = ({ token, role, userId, hotelId, name }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    localStorage.setItem('userId', userId);
    localStorage.setItem('hotelId', hotelId);

    setAuth({ token, role, name, userId: Number(userId), hotelId: Number(hotelId), });

  };




  return (
    <AuthContext.Provider value={{ auth, login, logout, loading }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
