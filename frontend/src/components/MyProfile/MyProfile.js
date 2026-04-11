import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/http';
import './MyProfile.css';

const MyProfile = () => {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({});

  const customerId = localStorage.getItem('customerId');

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/customers/${customerId}`);
      setProfile(res);
      setForm({
        first_name: res.first_name || '',
        last_name:  res.last_name  || '',
        phone:      res.phone      || '',
        city:       res.city       || '',
      });
    } catch (e) {
      console.error('Error fetching profile:', e);
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/customers/${customerId}`, form);
      toast.success('Profile updated successfully!');
      setShowEdit(false);
      fetchProfile();
    } catch (e) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="profile-msg">Loading profile...</p>;
  if (!profile) return <p className="profile-msg">Profile not found.</p>;

  return (
    <div className="module-content">
      <div className="module-header">
        <h2>My Profile</h2>
        <button className="edit-profile-btn" onClick={() => setShowEdit(true)}>
          ✏️ Edit Profile
        </button>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar">
          {(profile.first_name || profile.email || '?').charAt(0).toUpperCase()}
        </div>
        <div className="profile-details">
          <div className="profile-row">
            <span className="profile-label">First Name</span>
            <span className="profile-value">{profile.first_name || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Last Name</span>
            <span className="profile-value">{profile.last_name || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{profile.email}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Phone</span>
            <span className="profile-value">{profile.phone || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">City</span>
            <span className="profile-value">{profile.city || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Role</span>
            <span className="profile-value profile-role">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Drawer */}
      {showEdit && (
        <>
          <div className="drawer-overlay" onClick={() => setShowEdit(false)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2>Edit Profile</h2>
              <button className="drawer-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <div className="drawer-content">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => setShowEdit(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyProfile;
