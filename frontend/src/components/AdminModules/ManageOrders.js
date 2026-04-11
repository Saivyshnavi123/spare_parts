import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/http';
import OrderDetailDrawer from '../rightDrawers/OrderDetailDrawer';
import './AdminModules.css';

const ManageOrders = () => {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [drawerOrder, setDrawerOrder]   = useState(null);   // full detail object
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  const adminId = localStorage.getItem('customerId');

  useEffect(() => { fetchOrders(); }, []); // eslint-disable-line

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders?admin_id=${adminId}`);
      setOrders(res.orders || []);
    } catch (e) {
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async (orderId) => {
    setDrawerOpen(true);
    setDrawerOrder(null);
    setDrawerLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setDrawerOrder(res);
    } catch (e) {
      toast.error('Failed to load order details.');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerOrder(null);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/orders/${drawerOrder.order_id}`, { status: newStatus });
      setDrawerOrder((prev) => ({ ...prev, status: newStatus }));
      setOrders((prev) =>
        prev.map((o) => (o.order_id === drawerOrder.order_id ? { ...o, status: newStatus } : o))
      );
      toast.success('Status updated.');
    } catch (e) {
      toast.error('Failed to update status.');
    }
  };

  if (loading) return <p className="admin-msg">Loading orders...</p>;
  if (orders.length === 0) return <p className="admin-msg">No orders found.</p>;

  return (
    <div className="module-content">
      <h2>Manage Orders</h2>

      {/* ── Orders List Table ── */}
      <table className="admin-table orders-list-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.order_id}
              className="order-list-row"
              onClick={() => handleOpenDrawer(order.order_id)}
            >
              <td>#{order.order_id}</td>
              <td>{order.customer_name}</td>
              <td>${order.total_amount?.toFixed(2)}</td>
              <td>{order.payment_method || 'Not Paid'}</td>
              <td><strong>{order.status}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Order Detail Drawer ── */}
      {drawerOpen && (
        <OrderDetailDrawer
          order={drawerOrder}
          loading={drawerLoading}
          onClose={handleCloseDrawer}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default ManageOrders;
