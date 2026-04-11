import React, { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';

const PrintableBill = forwardRef(({
  customername,
  mobileNumber,
  paymentType,
  billItems,
  total,
  hotelInfo
}, ref) => {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const taxRate = 0.05;
  const tax = total * taxRate;
  const grandTotal = total + tax;

  return (
    <div ref={ref} className="p-4 font-mono" style={{ width: '300px' }}>
      <div className="text-center mb-3">
        <FontAwesomeIcon icon={faReceipt} className="text-2xl mb-1" />
        <h2 className="text-xl font-bold">{hotelInfo?.name || 'Hotel'}</h2>
        <p className="text-sm">{hotelInfo?.address || ''}</p>
        <p className="text-xs">GSTIN: {hotelInfo?.gstin || ''}</p>
      </div>

      <div className="text-center text-xs mb-4">
        <div>--------------------------------</div>
        <p>DATE: {date} {time}</p>
        <p>BILL NO: {Date.now().toString().slice(-6)}</p>
        <p>CUSTOMER: {customername || 'Walk-in'}</p>
        <p>MOBILE: {mobileNumber || 'N/A'}</p>
        <p>PAYMENT: {paymentType?.toUpperCase() || 'CASH'}</p>
        <div>--------------------------------</div>
      </div>

      <table className="w-full mb-2">
        <thead>
          <tr className="text-xs">
            <th className="text-left">ITEM</th>
            <th className="text-right">PRICE</th>
          </tr>
        </thead>
        <tbody>
          {billItems.map((item) => (
            <tr key={item.id}>
              <td className="text-xs">
                {item.name} x{item.quantity}
              </td>
              <td className="text-right text-xs">
                ₹{(item.price * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-xs my-3">
        <div>--------------------------------</div>
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (5%):</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>TOTAL:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
        <div>--------------------------------</div>
      </div>

      <div className="text-center text-xs mt-4">
        <p>Thank you for your visit!</p>
        <p className="font-bold">** Have a nice day **</p>
      </div>
    </div>
  );
});

PrintableBill.displayName = 'PrintableBill';

export default PrintableBill;