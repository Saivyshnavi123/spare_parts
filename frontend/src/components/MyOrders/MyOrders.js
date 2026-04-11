import React, { useEffect, useState } from 'react';
import { FaCreditCard } from 'react-icons/fa';
import api from '../../api/http';
import PaymentDrawer from '../Payment/PaymentDrawer';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [payOrder, setPayOrder]           = useState(null); // { orderId, total }

  const customerId = localStorage.getItem('customerId');

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/customers/${customerId}/orders`);
      setOrders(response.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customerId) {
      setError('Customer not found. Please login again.');
      setLoading(false);
      return;
    }
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="orders-msg">Loading orders...</p>;
  if (error)   return <p className="orders-msg orders-error">{error}</p>;
  if (orders.length === 0) return <p className="orders-msg">You have no orders yet.</p>;

  // Flatten all items across all orders into one table
  const rows = orders.flatMap((order) =>
    order.items.map((item, idx) => ({
      orderId:            order.order_id,
      status:             order.status,
      total:              order.total_amount,
      productId:          item.product_id,
      productName:        item.product_name,
      productDescription: item.description,
      qty:                item.quantity,
      price:              item.price,
      subtotal:           item.subtotal,
      isFirstItem:        idx === 0,
      itemCount:          order.items.length,
    }))
  );

  return (
    <>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Status</th>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Subtotal</th>
            <th>Order Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.isFirstItem && (
                <>
                  <td rowSpan={row.itemCount}>{row.orderId}</td>
                  <td rowSpan={row.itemCount}><strong>{row.status}</strong></td>
                </>
              )}
              <td>{row.productId}</td>
              <td>{row.productName}</td>
              <td className="desc-cell" title={row.productDescription}>{row.productDescription}</td>
              <td>{row.qty}</td>
              <td>${row.price?.toFixed(2)}</td>
              <td>${row.subtotal?.toFixed(2)}</td>
              {row.isFirstItem && (
                <td rowSpan={row.itemCount}><strong>${row.total?.toFixed(2)}</strong></td>
              )}
              {row.isFirstItem && (
                <td rowSpan={row.itemCount}>
                  {row.status === 'Pending' ? (
                    <button
                      className="pay-now-btn"
                      onClick={() => setPayOrder({ orderId: row.orderId, total: row.total })}
                    >
                      <FaCreditCard style={{ marginRight: '5px' }} /> Pay Now
                    </button>
                  ) : (
                    <span className="paid-label">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment Drawer for Pay Later orders */}
      {payOrder && (
        <PaymentDrawer
          orderId={payOrder.orderId}
          totalAmount={payOrder.total}
          onSuccess={() => { setPayOrder(null); fetchOrders(); }}
          onClose={() => setPayOrder(null)}
        />
      )}
    </>
  );
};

export default MyOrders;

