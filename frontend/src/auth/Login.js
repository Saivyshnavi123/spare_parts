import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/http';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    
    try {
      const payload = {
        email: formData.email,
        password: formData.password
      };
      
      const response = await api.post('/login', payload);
      
      setLoading(false);
      
      // Store user data in localStorage
      if (response.isValid) {
        // Store role, customer_id, first_name, and email
        localStorage.setItem('userRole', response.role);
        localStorage.setItem('customerId', response.customer_id);
        localStorage.setItem('userEmail', formData.email);
        if (response.first_name) {
          localStorage.setItem('firstName', response.first_name);
        }
        
        toast.success('Logged in successfully!');
        
        // Route based on role
        if (response.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
      
    } catch (error) {
      setLoading(false);
      
      // Show error message from API
      if (error.data && error.data.message) {
        toast.error(error.data.message);
      } else if (error.data && typeof error.data === 'string') {
        toast.error(error.data);
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 style={{ textAlign: 'center', marginBottom: '18px', color: '#4b2996' }}>Login</h2>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            placeholder="Enter your email"
            autoComplete="off"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error' : ''}
            placeholder="Enter your password"
            autoComplete="off"
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="login-footer">
          <span>Don't have an account?{' '}
            <button
              type="button"
              className="signup-link"
              style={{ background: 'none', border: 'none', padding: 0, color: '#667eea', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => navigate('/register')}
            >
              Please register
            </button>
          </span>
        </div>
      </form>
    </div>
  );
};

export default Login;
