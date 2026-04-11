import React, { useState } from 'react';
import printerService from '../../services/printerService';

const DirectPaymentModal = ({
  isOpen,
  onClose,
  billItems,
  taxPercentage,
  total,
  finalTotal,
  customername,
  mobileNumber,
  paymentType,
  setPaymentType,
  handleConfirmPayment,
  hotelInfo,
  tableNumber,
  diningType,
  printerStatus,
  autoPrintEnabled,
  setAutoPrintEnabled,
  isConnectingToPrinter,
  onReconnectPrinter
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!paymentType) {
      alert('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    try {
      await handleConfirmPayment();
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Calculate overall GST
  const totalAmount = billItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalGST = (totalAmount * taxPercentage) / 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
     <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">Confirm Payment</h2>
        </div>

        <div className="p-4 space-y-3">
          {/* Printer Status */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Printer Status:</span>
              <span className={`text-sm font-medium ${
                printerStatus.includes('Connected') ? 'text-green-600' :
                printerStatus.includes('detected') ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {printerStatus}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">Auto-print:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintEnabled}
                  onChange={(e) => setAutoPrintEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {isConnectingToPrinter && (
              <div className="text-xs text-blue-600 mt-1 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Connecting to printer...
              </div>
            )}

            {!printerStatus.includes('Connected') && (
              <button
                onClick={onReconnectPrinter}
                disabled={isConnectingToPrinter}
                className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isConnectingToPrinter ? 'Connecting...' : 'Reconnect Printer'}
              </button>
            )}
          </div>

          {/* Customer Details */}
          <div className="bg-blue-50 rounded-lg p-3">
            <h3 className="font-semibold text-blue-800 mb-2">Customer Details</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Name: {customername || 'Walk-in Customer'}</div>
              <div>Mobile: {mobileNumber || 'N/A'}</div>
              <div>Type: {diningType === 'takeaway' ? 'Takeaway' : 'Dine-in'}</div>
              {tableNumber && diningType !== 'takeaway' && <div>Table: {tableNumber}</div>}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">
              Order Summary ({billItems.length} items)
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {billItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      Qty: {item.quantity} x ₹{item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold text-indigo-600">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t space-y-1">
              {/* Overall GST */}
              <div className="flex justify-between items-center text-gray-700">
                <span>GST ({taxPercentage}%):</span>
                <span className="text-green-600">₹{totalGST.toFixed(2)}</span>
              </div>

              {/* Final Total */}
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Payment Method</h3>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Payment Method</option>
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI</option>
              <option value="other">🔄 Other</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || !paymentType}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Confirm & ${autoPrintEnabled ? 'Auto-Print' : 'Save'}`
              )}
            </button>
          </div>

          {/* Print Info */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            {autoPrintEnabled
              ? 'Bill will be printed automatically after confirmation'
              : 'Auto-print is disabled - bill will be saved only'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectPaymentModal;
