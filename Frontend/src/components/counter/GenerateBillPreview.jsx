import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import printerService from "../../services/printerService";
import axios from "axios";

const GenerateBillPreview = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const bill = state?.billData;

  if (!bill) return <p className="p-6">No Bill Data</p>;

  const handlePrint = async () => {
    try {
      const hasPrinter =
        printerService?.isConnected &&
        printerService?.selectedPrinter?.connected;

      const billData = {
        hotelId: bill.hotelId,
        staffId: localStorage.getItem("staffId") || "1",
        customername: bill.customername || "Walk-in Customer",
        phoneNumber: bill.phoneNumber || "N/A",
        paymentType: bill.paymentType || "cash",
        items: bill.items.map(item => ({
          productId: item.productId || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: bill.finalTotal,
        tableNumber: bill.tableNumber || null,
        diningType: bill.diningType || null,
        carDetails: bill.carDetails || null,
        orderId: bill.orderId || null
      };

      console.log("📤 FINAL BILL DATA:", billData);

      // ✅ 1. SAVE BILL
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/create`,
        billData
      );

      console.log("✅ BILL RESPONSE:", res.data);

      // ✅ 3. PRINT
      if (hasPrinter) {
        await printerService.printBill({
          items: bill.items,
          grandTotal: bill.finalTotal
        });
      } else {
        console.log("⚠️ No printer available - Bill settled anyway");
      }

      // ✅ 4. REDIRECT
       setTimeout(() => {
        navigate(`/counter/${bill.hotelId}`);
      }, 1500);

    } catch (err) {
      console.error("❌ ERROR:", err.response?.data || err.message);
      alert("Bill save failed!");
    }
  };
  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start py-6 print:bg-white print:p-0">
  <div className="bg-white w-[320px] shadow-lg p-4 text-xs font-mono print:shadow-none">

    {/* Header */}
    <div className="text-center border-b pb-2">
      <h2 className="text-lg font-bold">{bill.hotelName || "Restaurant"}</h2>
      <p>{bill.address || "Address here"}</p>
      <p>GST: {bill.gstin || "N/A"}</p>
    </div>

    {/* Info */}
    <div className="mt-2">
      <p>Date: {new Date().toLocaleDateString()}</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
      <p>Customer: {bill.customername}</p>
      <p>Table: {bill.tableNumber || "Takeaway"}</p>
    </div>

    {/* Items */}
    <div className="mt-2 border-t border-b py-2">
      {bill.items.map((item, i) => (
        <div key={i} className="flex justify-between">
          <span>
            {item.name} x{item.quantity}
          </span>
          <span>₹{item.price * item.quantity}</span>
        </div>
      ))}
    </div>

    {/* Totals */}
    <div className="mt-2 space-y-1">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>₹{bill.total}</span>
      </div>

      <div className="flex justify-between">
        <span>Tax</span>
        <span>₹{bill.taxAmount || 0}</span>
      </div>

      <div className="flex justify-between font-bold border-t pt-1">
        <span>Total</span>
        <span>₹{bill.finalTotal}</span>
      </div>
    </div>

    {/* Footer */}
    <div className="text-center mt-3 border-t pt-2">
      <p>Payment: {bill.paymentType}</p>
      <p>Thank You 🙏</p>
      <p>Visit Again!</p>
    </div>

    {/* Buttons (hide in print) */}
    <div className="mt-4 flex gap-2 print:hidden">
      <button
        onClick={handlePrint}
        className="flex-1 bg-purple-600 text-white py-2 rounded"
      >
        Print
      </button>

      <button
        onClick={handleCancel}
        className="flex-1 bg-gray-500 text-white py-2 rounded"
      >
        Cancel
      </button>
    </div>
  </div>
</div>
  );
};

export default GenerateBillPreview;