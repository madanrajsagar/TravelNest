import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Set global axios config to send credentials (cookies) on every request
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://13.127.90.67:8080';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currUser, setCurrUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch wishlist items
  const fetchWishlist = async () => {
    try {
      const res = await axios.get('/api/wishlist');
      if (res.data && res.data.success) {
        // Map to string IDs for easy lookup
        setWishlist(res.data.wishlist.map(item => item._id || item));
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    }
  };

  // Fetch current user on app mount
  const checkUserSession = async () => {
    try {
      const response = await axios.get('/api/currUser');
      if (response.data && response.data.user) {
        setCurrUser(response.data.user);
      } else {
        setCurrUser(null);
        setWishlist([]);
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      setCurrUser(null);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  // Fetch wishlist whenever currUser changes to logged in
  useEffect(() => {
    if (currUser) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [currUser]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/login', { username, password });
      if (response.data && response.data.success) {
        setCurrUser(response.data.user);
        return { success: true, message: response.data.message };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const signup = async (username, email, password) => {
    try {
      const response = await axios.post('/api/signup', { username, email, password });
      if (response.data && response.data.success) {
        setCurrUser(response.data.user);
        return { success: true, message: response.data.message };
      }
      return { success: false, error: 'Signup failed' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Signup failed';
      return { success: false, error: errorMsg };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const response = await axios.post('/api/auth/google', { credential });
      if (response.data && response.data.success) {
        setCurrUser(response.data.user);
        return { success: true, message: response.data.message };
      }
      return { success: false, error: 'Google login failed' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Google login failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      const response = await axios.get('/api/logout');
      if (response.data && response.data.success) {
        setCurrUser(null);
        setWishlist([]);
        return { success: true, message: response.data.message };
      }
      return { success: false, error: 'Logout failed' };
    } catch (err) {
      console.error('Logout error:', err);
      setCurrUser(null);
      setWishlist([]);
      return { success: true, message: 'Logged out locally' };
    }
  };

  const toggleWishlist = async (listingId) => {
    if (!currUser) {
      toast.error('Please log in to add items to your wishlist!');
      return false;
    }
    const isSaved = wishlist.includes(listingId);
    try {
      if (isSaved) {
        const res = await axios.delete(`/api/wishlist/${listingId}`);
        if (res.data.success) {
          setWishlist(prev => prev.filter(id => id !== listingId));
          toast.success('Removed from wishlist');
          return true;
        }
      } else {
        const res = await axios.post(`/api/wishlist/${listingId}`);
        if (res.data.success) {
          setWishlist(prev => [...prev, listingId]);
          toast.success('Added to wishlist');
          return true;
        }
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ currUser, loading, login, signup, logout, googleLogin, wishlist, toggleWishlist, checkUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
