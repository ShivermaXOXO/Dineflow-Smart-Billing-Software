import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faReceipt, faPercentage } from "@fortawesome/free-solid-svg-icons";
const SettleBillModal = ({
  isOpen,
  onClose,
  total,
  finalTotal,
  addTax,
  setAddTax,
  taxPercentage,
  setTaxPercentage,
  paymentType,
  setPaymentType,
  handleConfirmPayment
}) => {
  if (!isOpen) return null;

  const taxAmount = addTax ? (total * taxPercentage) / 100 : 0;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faReceipt} />
            Settle Bill
          </h2>
          <button onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">

          {/* Total */}
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm">Subtotal: ₹{total}</p>
            {addTax && (
              <p className="text-sm">
                GST ({taxPercentage}%): ₹{taxAmount.toFixed(2)}
              </p>
            )}
            <p className="font-semibold text-lg">
              Final Amount: ₹{finalTotal}
            </p>
          </div>

          {/* GST Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={addTax}
              onChange={(e) => setAddTax(e.target.checked)}
            />
            <span>Add GST</span>

            {addTax && (
              <input
                type="number"
                className="ml-3 w-24 border rounded px-2 py-1"
                placeholder="%"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
              />
            )}
          </div>

          {/* Payment Mode */}
          <select
            className="w-full border rounded px-3 py-2"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          >
            <option value="">Select Payment Method</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3">
          <button
            className="flex-1 border rounded py-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
  className="flex-1 bg-green-600 text-white py-2 rounded"
            onClick={() => handleConfirmPayment(orderId)}
>
  Generate Bill
</button>

        </div>
      </div>
    </div>
  );
};

export default SettleBillModal;
