export function generateBillHTML({ customername, mobileNumber, paymentType, billItems, total, hotelInfo, diningType, tableNumber, carDetails }) {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const taxRate = 0.05;
  const tax = total * taxRate;
  const grandTotal = total + tax;
  console.log(hotelInfo)

  return `
    <html>
      <head>
        <title>Printable Bill</title>
        <style>
          body { font-family: monospace; width: 300px; margin: 0 auto; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .mb-3 { margin-bottom: 1rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mt-4 { margin-top: 1.5rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { font-size: 12px; padding: 2px 0; }
          th { text-align: left; }
          .right { text-align: right; }
          .divider { border-top: 1px dashed #333; margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="center mb-3">
          <div class="bold" style="font-size: 18px;">${hotelInfo?.name || 'Hotel'}</div>
          <div style="font-size: 13px;">${hotelInfo?.address || ''}</div>
          <div style="font-size: 11px;">GSTIN: ${hotelInfo?.gstin || ''}</div>
        </div>
        <div class="center mb-2" style="font-size: 11px;">
          <div class="divider"></div>
          <div>DATE: ${date} ${time}</div>
          <div>BILL NO: ${Date.now().toString().slice(-6)}</div>
          <div>CUSTOMER: ${customername || 'Walk-in'}</div>
          <div>MOBILE: ${mobileNumber || 'N/A'}</div>
          <div>DINING: ${diningType ? (diningType === 'dine-in' ? 'DINE-IN' : 'TAKEAWAY') : 'N/A'}</div>
          ${diningType === 'dine-in' && tableNumber ? `<div>TABLE: ${tableNumber}</div>` : ''}
          ${diningType === 'takeaway' && carDetails ? `<div>CAR: ${carDetails}</div>` : ''}
          <div>PAYMENT: ${(paymentType || 'CASH').toUpperCase()}</div>
          <div class="divider"></div>
        </div>
        <table class="mb-2">
          <thead>
            <tr>
              <th>ITEM</th>
              <th class="right">PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${billItems.map(item => `
              <tr>
                <td>${item.name} x${item.quantity}</td>
                <td class="right">₹${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="font-size: 11px;">
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;">
            <span>SUBTOTAL:</span>
            <span>₹${total.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>GST (5%):</span>
            <span>₹${tax.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;" class="bold">
            <span>TOTAL:</span>
            <span>₹${grandTotal.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
        </div>
        <div class="center mt-4" style="font-size: 11px;">
          <div>Thank you for your visit!</div>
          <div class="bold">** Have a nice day **</div>
          <div>------ Managed & developed by TechieGuys ------</div>
        </div>
      </body>
    </html>
  `;
}

export function handleNativePrint(billData) {
  const billHTML = generateBillHTML(billData);
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  printWindow.document.open();
  printWindow.document.write(billHTML);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}
