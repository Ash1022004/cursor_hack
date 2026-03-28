import axiosInstance from '@/network/core/axiosInstance';

/**
 * Turn Axios / network failures into an Error with a user-visible message.
 * Avoids throwing plain response bodies like `{}` (no `.message` in the UI).
 */
function toRequestError(error) {
  const res = error?.response;
  const status = res?.status;
  const data = res?.data;

  if (data !== undefined && data !== null) {
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          const msg = messageFromBody(parsed);
          if (msg) return new Error(msg);
        } catch {
          /* fall through */
        }
      }
      if (trimmed) return new Error(trimmed.slice(0, 500));
    } else if (typeof data === 'object') {
      const msg = messageFromBody(data);
      if (msg) return new Error(msg);
      if (status === 404) {
        return new Error(
          'Registration service not found. Check that Convex is running and /api is proxied (CONVEX_SITE_URL).'
        );
      }
      if (status >= 500) {
        return new Error('Server error. Please try again in a moment.');
      }
      if (status) {
        return new Error(`Request failed (${status}). Please try again.`);
      }
    }
  }

  if (error?.code === 'ECONNABORTED') {
    return new Error('Request timed out. Check your connection and try again.');
  }
  if (error?.message) {
    return new Error(error.message);
  }
  return new Error('Network error. Check your connection and try again.');
}

function messageFromBody(body) {
  if (!body || typeof body !== 'object') return '';
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim();
  }
  // Convex HTTP API / some proxies use errorMessage
  if (typeof body.errorMessage === 'string' && body.errorMessage.trim()) {
    return body.errorMessage.trim();
  }
  if (Array.isArray(body.errors) && body.errors.length) {
    const parts = body.errors
      .map((e) => {
        if (e && typeof e === 'object' && typeof e.msg === 'string') return e.msg;
        return '';
      })
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return '';
}

class AuthService {
  async login(email, password) {
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw toRequestError(error);
    }
  }

  async loginCounsellor(email, password) {
    try {
      const response = await axiosInstance.post('/api/auth/login/counsellor', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw toRequestError(error);
    }
  }

  async loginAdmin(email, password) {
    try {
      const response = await axiosInstance.post('/api/auth/login/admin', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw toRequestError(error);
    }
  }

  async register(userData) {
    try {
      const response = await axiosInstance.post('/api/auth/signUp', userData);
      return response.data;
    } catch (error) {
      throw toRequestError(error);
    }
  }

  logout() {
    // Remove token and user from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Call the backend logout endpoint
    return axiosInstance.post('/api/auth/logout');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
