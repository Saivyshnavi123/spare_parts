import React, { useEffect, useState } from 'react';
import api from '../../api/http';
import './AdminModules.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers');
        setCustomers(res.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  if (loading) return <p className="admin-msg">Loading customers...</p>;
  if (customers.length === 0) return <p className="admin-msg">No customers found.</p>;

  return (
    <div className="module-content">
      <h2>Customers</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>City</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.customer_id}>
              <td>{c.customer_id}</td>
              <td>{c.first_name || '—'}</td>
              <td>{c.last_name || '—'}</td>
              <td>{c.email}</td>
              <td>{c.phone || '—'}</td>
              <td>{c.city || '—'}</td>
              <td><strong>{c.role}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Customers;
