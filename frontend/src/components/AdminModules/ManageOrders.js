import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/http';
import './AdminModules.css';

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const ManageOrders = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      // Fetch all customers then their orders — backend has /customers list
      const cusRes = await api.get('/customers');
      const customers = cusRes.results || [];

      const allOrders = [];
      await Promise.all(
        customers.map(async (c) => {
          try {
            const res = await api.get(`/customers/${c.customer_id}/orders`);
            (res.orders || []).forEach((o) =>
              allOrders.push({ ...o, customerEmail: c.email })
            );
          } catch (_) {}
        })
      );
      // sort by order_id desc
      allOrders.sort((a, b) => b.order_id - a.order_id);
      setOrders(allOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <p className="admin-msg">Loading orders...</p>;
  if (orders.length === 0) return <p className="admin-msg">No orders found.</p>;

  return (
    <div className="module-content">
      <h2>Manage Orders</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Update Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.order_id}>
              <td>{order.order_id}</td>
              <td>{order.customerEmail}</td>
              <td>${order.total_amount?.toFixed(2)}</td>
              <td><strong>{order.status}</strong></td>
              <td>
                <select
                  className="status-select"
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageOrders;
