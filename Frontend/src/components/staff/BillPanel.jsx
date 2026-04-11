import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faPhone, 
  faCreditCard, 
  faReceipt, 
  faShoppingCart,
  faMoneyBillWave,
  faPercentage,
  faTable,
  faCheck,
  faCar,
  faUtensils
} from '@fortawesome/free-solid-svg-icons';
import BillItem from './BillItem';
const BillPanel = ({
  billItems,
  total,
  finalTotal,
  setFinalTotal,
  mobileNumber,
  setMobileNumber,
  customername,
  setcustomername,
  paymentType,
  setPaymentType,
  handleSubmitBill,
  onRemoveItem,
  onUpdateQuantity,
  staffName = null, // Prop for staff name
  orderInfo = null, // Prop for order information
  // New props for tax and table number
  tableNumber = '',
  setTableNumber = () => {},
  addTax = false,
  setAddTax = () => {},
  taxPercentage = 0,
  setTaxPercentage = () => {},
  // New props for dining type and car details
  diningType = '',
  setDiningType = () => {},
  carDetails = '',
  setCarDetails = () => {}
}) => {
  const itemCount = billItems.reduce((sum, item) => sum + item.quantity, 0);
  // Calculate tax amount and final total
  const subtotal = total || 0;
  const taxAmount = addTax && taxPercentage ? (subtotal * parseFloat(taxPercentage) / 100) : 0;
  const finalValue = subtotal + taxAmount;
  React.useEffect(() => {
    setFinalTotal(subtotal + taxAmount);
  }, [subtotal, taxAmount, setFinalTotal]);
  return (
    <div className="space-y-6">
      {/* Order Information */}
      {orderInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-700 font-medium flex items-center">
              <FontAwesomeIcon icon={faReceipt} className="mr-2" />
              Order #{orderInfo.orderNumber || 'N/A'}
            </span>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              From Order System
            </span>
          </div>
          {orderInfo.tableNumber && (
            <p className="text-sm text-blue-600">Table: {orderInfo.tableNumber}</p>
          )}
        </div>
      )}

      {/* Staff Information */}
      {staffName && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faUser} className="text-green-600 mr-2" />
            <span className="text-green-700 font-medium">Bill handled by: {staffName}</span>
          </div>
        </div>
      )}

      {/* Bill Items Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-gray-600" />
            Items ({itemCount})
          </h3>
        </div>

        {billItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <FontAwesomeIcon icon={faShoppingCart} className="text-3xl mb-2 text-gray-300" />
            <p className="text-sm">No items added</p>
            <p className="text-xs text-gray-400">Start adding items from the menu</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {billItems.map((item, index) => (
              <BillItem 
                key={item.id || `bill-item-${index}`} 
                item={item}
                onRemoveItem={onRemoveItem}
                onUpdateQuantity={onUpdateQuantity}
              />
            ))}
          </div>
        )}
      </div>

      {/* Total Section */}
      {billItems.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Subtotal:</span>
            <span className="text-lg font-bold text-gray-700">₹{subtotal.toLocaleString()}</span>
          </div>
          
          {addTax && taxAmount > 0 && (
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm text-gray-600">Tax/GST ({taxPercentage}%):</span>
              <span className="text-sm font-medium text-gray-600">₹{taxAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center border-t pt-2">
            <span className="text-xl font-bold text-gray-800">Final Total:</span>
            <span className="text-2xl font-bold text-indigo-600">₹{finalTotal.toLocaleString()}</span>
          </div>
          
          <div className="text-sm text-gray-600 mt-1">
            {itemCount} item{itemCount !== 1 ? 's' : ''} • Avg: ₹{itemCount > 0 ? Math.round(finalTotal / itemCount) : 0}
          </div>
        </div>
      )}

      {/* Customer Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-600" />
          Customer Details
        </h3>
        
        <div className="space-y-3">
          <div className="relative">
            <label htmlFor="customername" className="sr-only">Customer Name</label>
            <FontAwesomeIcon
              icon={faUser}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              id="customername"
              name="customername"
              placeholder="Customer Name"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={customername}
              onChange={e => setcustomername(e.target.value)}
            />
          </div>

          <div className="relative">
            <label htmlFor="mobileNumber" className="sr-only">Mobile Number</label>
            <FontAwesomeIcon
              icon={faPhone}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              placeholder="Mobile Number"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={mobileNumber}
              onChange={e => setMobileNumber(e.target.value)}
            />
          </div>

          {/* Dining Type Selection */}
          <div className="relative">
            <label htmlFor="diningType" className="sr-only">Dining Type</label>
            <FontAwesomeIcon
              icon={faUtensils}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <select
              id="diningType"
              name="diningType"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              value={diningType}
              onChange={e => {
                setDiningType(e.target.value);
                // Clear related fields when changing dining type
                if (e.target.value === 'dine-in') {
                  setCarDetails('');
                } else if (e.target.value === 'takeaway') {
                  setTableNumber('');
                }
              }}
            >
              <option value="">Select Dining Type</option>
              <option value="dine-in">🍽️ Dine-In</option>
              <option value="takeaway">🥡 Takeaway</option>
            </select>
          </div>

          {/* Conditional Fields based on Dining Type */}
          {diningType === 'dine-in' && (
            <div className="relative">
              <label htmlFor="tableNumber" className="sr-only">Table Number</label>
              <FontAwesomeIcon
                icon={faTable}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                id="tableNumber"
                name="tableNumber"
                placeholder="Enter Table Number"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
              />
            </div>
          )}

          {diningType === 'takeaway' && (
            <div className="relative">
              <label htmlFor="carDetails" className="sr-only">Car Number</label>
              <FontAwesomeIcon
                icon={faCar}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                id="carDetails"
                name="carDetails"
                placeholder="Enter Car Number"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={carDetails}
                onChange={e => setCarDetails(e.target.value)}
              />
            </div>
          )}

          <div className="relative">
            <label htmlFor="paymentType" className="sr-only">Payment Method</label>
            <FontAwesomeIcon
              icon={faCreditCard}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <select
              id="paymentType"
              name="paymentType"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              value={paymentType}
              onChange={e => setPaymentType(e.target.value)}
            >
              <option value="">Select Payment Method</option>
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI</option>
              <option value="other">🔄 Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tax/GST Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FontAwesomeIcon icon={faPercentage} className="mr-2 text-gray-600" />
          Tax/GST Settings
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <label htmlFor="addTax" className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  id="addTax"
                  name="addTax"
                  checked={addTax}
                  onChange={(e) => {
                    setAddTax(e.target.checked);
                    if (!e.target.checked) {
                      setTaxPercentage('');
                    }
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded ${addTax ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'} flex items-center justify-center`}>
                  {addTax && (
                    <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
                  )}
                </div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Add Tax/GST</span>
            </label>
          </div>
          
          {addTax && (
            <div className="relative">
              <label htmlFor="taxPercentage" className="sr-only">Tax Percentage</label>
              <FontAwesomeIcon
                icon={faPercentage}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                id="taxPercentage"
                name="taxPercentage"
                placeholder="Enter tax percentage (e.g., 18)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={taxPercentage}
                onChange={e => setTaxPercentage(e.target.value)}
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
          billItems.length === 0 || !paymentType
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
        }`}
        onClick={handleSubmitBill}
        disabled={billItems.length === 0 || !paymentType}
      >
        <FontAwesomeIcon icon={faReceipt} />
        <span>
          {billItems.length === 0 ? 'Add Items to Continue' : `Generate Bill • ₹${finalTotal.toLocaleString()}`}
        </span>
      </button>

      {/* Payment Method Info */}
      {paymentType && (
        <div className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg p-2">
          <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />
          Payment will be processed via {paymentType.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default BillPanel;
