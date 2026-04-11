import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';


const Navbar = ({ title, showCart = false, cartCount = 0, onCartClick }) => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail]         = useState('');
  const [userRole, setUserRole]           = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    setUserEmail(localStorage.getItem('userEmail') || '');
    setUserRole(localStorage.getItem('userRole') || '');
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProfileMenu && !e.target.closest('.profile-icon-container')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('customerId');
    localStorage.removeItem('firstName');
    navigate('/login');
  };

  return (
    <div className="dashboard-header">
      <h1>{title}</h1>

      <div className="header-icons">
        {/* Cart Icon — visible only for users */}
        {showCart && (
          <div className="cart-icon-container">
            <div className="cart-icon" onClick={onCartClick}>
              🛒
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </div>
          </div>
        )}

        {/* Profile Icon */}
        <div className="profile-icon-container">
          <div
            className="profile-icon"
            onClick={() => setShowProfileMenu((prev) => !prev)}
          >
            {userEmail.charAt(0).toUpperCase() || '?'}
          </div>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-item">
                <strong>Email:</strong>{' '}
                {userEmail || 'N/A'}
              </div>
              <div className="profile-dropdown-item">
                <strong>Role:</strong> {userRole}
              </div>
              <div className="profile-dropdown-divider" />
              <div
                className="profile-dropdown-item logout-item"
                onClick={handleLogout}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
