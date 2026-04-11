import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faPhone,
  faCreditCard,
  faReceipt,
  faTimes,
  faCheck,
  faPrint,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';

const PaymentModal = ({
  isOpen,
  onClose,
  billItems,
  total,
  customername,
  mobileNumber,
  paymentType,
  setPaymentType,
  handleConfirmPayment,
  hotelInfo,
  handlePrint
}) => {
  const paymentMethods = [
    { value: 'cash', label: '💵 Cash', icon: faMoneyBillWave },
    { value: 'card', label: '💳 Card', icon: faCreditCard },
    { value: 'upi', label: '📱 UPI', icon: faCreditCard },
    { value: 'other', label: '🔄 Other', icon: faCreditCard }
  ];

  const ReadOnlyBillItem = ({ item }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
            <span>₹{item.price} each</span>
            <span className="font-medium">Qty: {item.quantity}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-indigo-600">
            ₹{(item.price * item.quantity).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <FontAwesomeIcon icon={faReceipt} className="mr-2" />
              Confirm Order
            </h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-600" />
              Customer Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400 w-4" />
                <span className="font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-gray-800">{customername}</span>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-400 w-4" />
                <span className="font-medium text-gray-600">Mobile:</span>
                <span className="ml-2 text-gray-800">{mobileNumber}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FontAwesomeIcon icon={faReceipt} className="mr-2 text-gray-600" />
              Order Summary ({billItems.length} items)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {billItems.map(item => (
                <ReadOnlyBillItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
              <span className="text-2xl font-bold text-indigo-600">₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FontAwesomeIcon icon={faCreditCard} className="mr-2 text-gray-600" />
              Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentType(method.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    paymentType === method.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-100 hover:text-red-600 hover:border-red-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPayment}
              disabled={!paymentType}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center ${
                !paymentType
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
              }`}
            >
              <FontAwesomeIcon icon={faPrint} className="mr-2" />
              Confirm & Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;