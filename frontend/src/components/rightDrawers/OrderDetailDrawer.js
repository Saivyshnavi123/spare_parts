import React from 'react';
import './Drawers.css';
import '../AdminModules/AdminModules.css';

const FLOW = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

const getNextStatus = (current) => {
  const idx = FLOW.indexOf(current);
  return idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
};

const canCancel = (status) => status === 'Pending' || status === 'Confirmed';
const isLocked  = (status) => status === 'Delivered' || status === 'Cancelled';

const OrderDetailDrawer = ({ order, loading, onClose, onStatusChange }) => {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer order-drawer">

        {/* Header */}
        <div className="drawer-header order-drawer-header">
          <h2 style={{ margin: 0 }}>
            {order ? `Order #${order.order_id}` : 'Order Details'}
          </h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="drawer-content">
          {loading || !order ? (
            <p className="drawer-loading">Loading details...</p>
          ) : (
            <>
              {/* Customer */}
              <div className="od-row"><span className="od-key">Customer</span><span className="od-val">{order.customer?.name}</span></div>
              <div className="od-row"><span className="od-key">Email</span><span className="od-val">{order.customer?.email}</span></div>
              <div className="od-row"><span className="od-key">Phone</span><span className="od-val">{order.customer?.phone || '—'}</span></div>
              <div className="od-row"><span className="od-key">City</span><span className="od-val">{order.customer?.city || '—'}</span></div>

              {/* Order summary */}
              <div className="od-row"><span className="od-key">Payment</span><span className="od-val">{order.payment_method || 'Not Paid'}</span></div>
              <div className="od-row"><span className="od-key">Total</span><span className="od-val"><strong>${order.total_amount?.toFixed(2)}</strong></span></div>

              {/* Items */}
              {order.items?.map((item) => (
                <div key={item.product_id} className="od-row">
                  <span className="od-key">Product Name</span>
                  <span className="od-val">{item.product_name} &nbsp;×{item.quantity}</span>
                </div>
              ))}

              {/* Status */}
              <div className="od-row">
                <span className="od-key">Status</span>
                <span className="od-val"><strong>{order.status}</strong></span>
              </div>

              {/* Actions — pinned to bottom */}
              <div className="od-row od-row-actions">
                {isLocked(order.status) ? (
                  <strong className="od-status-locked">
                    {order.status === 'Delivered' ? '✓ Order Delivered' : '✕ Order Cancelled'}
                  </strong>
                ) : (
                  <>
                    {canCancel(order.status) && (
                      <button className="od-cancel-btn" onClick={() => onStatusChange('Cancelled')}>
                        Cancel Order
                      </button>
                    )}
                    {getNextStatus(order.status) && (
                      !order.payment_method ? (
                        <strong className="od-status-locked">Payment Pending</strong>
                      ) : (
                        <button className="od-next-btn" onClick={() => onStatusChange(getNextStatus(order.status))}>
                          Mark as {getNextStatus(order.status)}
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderDetailDrawer;
