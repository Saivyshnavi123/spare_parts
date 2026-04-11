import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaCreditCard, FaMobileAlt } from 'react-icons/fa';
import api from '../../api/http';
import './PaymentDialog.css';

const PAYMENT_METHODS = [
  { label: 'Cash', icon: <FaMoneyBillWave /> },
  { label: 'Card', icon: <FaCreditCard /> },
  { label: 'UPI',  icon: <FaMobileAlt /> },
];

const PaymentDrawer = ({ orderId, totalAmount, onSuccess, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing]       = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await api.post(`/orders/${orderId}/payment`, {
        amount: totalAmount,
        payment_method: paymentMethod,
      });
      toast.success('Payment successful! Order is now Confirmed.');
      onSuccess();
    } catch (e) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="dialog-header">
          <h2>Complete Payment</h2>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="dialog-body">

          {/* Order Summary */}
          <div className="dialog-summary">
            <div className="dialog-summary-left">
              <span className="dialog-summary-label">Order ID</span>
              <span className="dialog-summary-order">#{orderId}</span>
            </div>
            <div>
              <span className="dialog-summary-label">Total</span>
              <div className="dialog-summary-total">${totalAmount?.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Method */}
          <p className="dialog-method-label">Select Payment Method</p>
          <div className="dialog-methods">
            {PAYMENT_METHODS.map(({ label, icon }) => (
              <div
                key={label}
                className={`dialog-method-option ${paymentMethod === label ? 'selected' : ''}`}
                onClick={() => setPaymentMethod(label)}
              >
                <span className="dialog-method-icon">{icon}</span>
                <span className="dialog-method-name">{label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="dialog-actions">
            <button
              className="dialog-confirm-btn"
              onClick={handleConfirm}
              disabled={processing}
            >
              {processing ? 'Processing...' : `Pay $${totalAmount?.toFixed(2)}`}
            </button>
            <button className="dialog-later-btn" onClick={onClose}>
              Pay Later
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentDrawer;
