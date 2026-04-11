import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faReceipt } from "@fortawesome/free-solid-svg-icons";
import totalVisit from "../../utils/totalVisitsUtils";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { QRCodeCanvas } from "qrcode.react"

const DirectBillModal = ({
  billItems = [],
  isOpen,
  onClose,
  total = 0,
  taxPercentage = 0,
  setTaxPercentage,
  paymentType = "",
  setPaymentType,
  handleConfirmPayment,
  printerStatus = "", 
  discount,
 setDiscount,
 discountType,
 setDiscountType,
mobileNumber
   
}) => {
  const { auth } = useAuth()
  const navigate = useNavigate();
  const [visitCount,setVisitCount]= useState(0)
  if (!isOpen) return null;
  const totalVisits= async()=>{
    const count=await totalVisit(mobileNumber,auth.hotelId)
    setVisitCount(count)
    }
  useEffect(()=>{
    totalVisits()
  },[])
 
  const discountAmount = discountType === 'percentage' ? (total * discount) / 100 : parseFloat(discount || 0);
  // const totalAfterDiscount=total-discountAmount
   const gstAmount = taxPercentage ? (total * taxPercentage) / 100 : 0;
  const finalAmount = total + gstAmount -discountAmount;
  const upiId = "yourname@bank"; // REPLACE THIS with Restaurant UPI ID
  const restaurantName = "DineFlow";
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(restaurantName)}&am=${finalAmount.toFixed(2)}&cu=INR`;

  async function printBill() {
    try {
      if (!paymentType) {
        toast.warning("Please select a payment method");
        return;
      }
      await handleConfirmPayment(finalAmount)

      const billData = {
        items: billItems,
        total: total,
        finalTotal: finalAmount,
        customername: mobileNumber || "Walk-in Customer",
        phoneNumber: mobileNumber,
        paymentType: paymentType,
        hotelId: auth.hotelId,
      };

      navigate("/generate-bill-preview", {
        state: { billData }
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load preview");
    }
  }

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

          {/* Amount Summary */}
          <div className="bg-gray-50 p-3 rounded">
            <p>Subtotal: ₹{total}</p>
            <p>GST ({taxPercentage || 0}%): ₹{gstAmount.toFixed(2)}</p>
            <p className="font-semibold text-lg">Final Amount: ₹{finalAmount}</p>
          </div>

          {/* GST */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">GST %</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-24"
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(e.target.value)}
            />
            <div className="flex items-center gap-3" >
              <span>Visits</span>
              {visitCount}
            </div>
          </div>
          {/* Discount */}
          <div  className="flex items-center gap-3">
        <label className="text-sm font-medium">Discount</label>
          <select className=" w-12 border rounded text-sm "
          value={discountType}
          onChange={e=>setDiscountType(e.target.value)}
          >
            <option value="percentage">%</option>
            <option value="amount">Rs</option>

          </select>
          <input type="number" placeholder="Discount" className="border rounded pl-2" onChange={e=>setDiscount(e.target.value)}  />
            </div>

          {/* Payment Method */}
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
        {paymentType === "upi" && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded flex flex-col items-center justify-center mt-4">
            <p className="font-semibold mb-2">Scan to Pay ₹{finalAmount.toFixed(2)}</p>
            <div className="bg-white p-2 rounded shadow-sm">
              <QRCodeCanvas value={upiLink} size={150} />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Ask the customer to scan. Generate bill only after payment is received.
            </p>
          </div>
        )}
        {/* Footer */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={printBill}
            className="flex-1 bg-green-600 text-white py-2 rounded"
          >
            Generate Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectBillModal;
