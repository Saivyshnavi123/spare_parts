import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/http';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    password: ''
  });
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
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
        first_name: formData.firstName,
        password: formData.password
      };
      
      await api.post('/register', payload);
      
      setLoading(false);
      toast.success('Registration successful! Please login.');
      
      // Redirect to login page after 1.5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error) {
      setLoading(false);
      
      // Show error message from API
      if (error.data && error.data.message) {
        toast.error(error.data.message);
      } else if (error.data && typeof error.data === 'string') {
        toast.error(error.data);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
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
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={errors.firstName ? 'error' : ''}
            placeholder="Enter your first name"
            autoComplete="off"
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
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
            placeholder="Create a password"
            autoComplete="off"
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>
        <button type="submit" className="register-btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        <div className="register-footer">
          <span>Already have an account?{' '}
            <button
              type="button"
              className="login-link"
              style={{ background: 'none', border: 'none', padding: 0, color: '#667eea', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => navigate('/login')}
            >
              Please login
            </button>
          </span>
        </div>
      </form>
    </div>
  );
};

export default Register;
