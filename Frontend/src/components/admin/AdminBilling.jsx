// src/components/admin/AdminBilling.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/authContext";
import socket from "../../services/socket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faReceipt,
  faShoppingCart,
  faMoneyBillWave,
  faClock,
  faStore,
  faChartLine,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import ProductList from "../staff/ProductList";
import BillPanel from "../staff/BillPanel";
import PaymentModal from "../staff/PaymentModal";
import { toast } from "react-toastify";

const AdminBilling = ({ hotelId }) => {
  const { auth } = useAuth();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [billItems, setBillItems] = useState([]);
  const [mobileNumber, setMobileNumber] = useState("");
  const [customername, setcustomername] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [todayStats, setTodayStats] = useState({
    myOrders: 0,
    myRevenue: 0,
    currentShiftOrders: 0,
    avgOrderValue: 0,
  });

  const total = billItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/products/${hotelId}`
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  // Fetch admin stats (similar to staff stats but for admin)
  const fetchAdminStats = async () => {
    try {
      // Get today's bills created by admin
      const adminId =
        localStorage.getItem("staffId") ||
        localStorage.getItem("userId") ||
        "1";
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/bill/admin-stats/${hotelId}/${adminId}`
      );
      setTodayStats(
        response.data || {
          myOrders: 0,
          myRevenue: 0,
          currentShiftOrders: 0,
          avgOrderValue: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      // Set default stats if API fails
      setTodayStats({
        myOrders: 0,
        myRevenue: 0,
        currentShiftOrders: 0,
        avgOrderValue: 0,
      });
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchProducts();
      fetchAdminStats();

      // Set up socket connection for real-time updates
      socket.connect();
      socket.emit("joinHotelRoom", hotelId);

      // Listen for bill creation events to refresh stats
      socket.on("billCreated", () => {
        console.log("Admin billing received billCreated event");
        fetchAdminStats();
      });
    }

    return () => {
      socket.off("billCreated");
    };
  }, [hotelId]);

  // Add item to bill
  const handleAddToBill = (product) => {
    const existingItem = billItems.find((item) => item.id === product.id);

    if (existingItem) {
      setBillItems(
        billItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setBillItems([...billItems, { ...product, quantity: 1 }]);
    }
  };

  // Remove item from bill
  const handleRemoveItem = (productId) => {
    setBillItems(billItems.filter((item) => item.id !== productId));
  };

  // Update item quantity
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else {
      setBillItems(
        billItems.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (billItems.length === 0) {
      toast.warning("Please add items to the bill");
      return;
    }
    setShowModal(true);
  };

  // Handle payment
  const handlePayment = async () => {
    try {
      if (!paymentType) {
        toast.warning("Please select a payment method");
        return;
      }

      const billData = {
        customername: customername || "Walk-in Customer",
        mobileNumber: mobileNumber || "N/A",
        items: billItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        total: total,
        paymentType,
        hotelId: hotelId,
        staffId:
          localStorage.getItem("staffId") ||
          localStorage.getItem("userId") ||
          "1", // Admin acts as staff for billing
        staffName: localStorage.getItem("username") || "Admin",
      };

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/create`,
        billData
      );

      toast.success("Bill created successfully!", {
        toastId: "bill-success",
      });

      // Reset form
      setBillItems([]);
      setMobileNumber("");
      setcustomername("");
      setPaymentType("");
      setShowModal(false);

      // Refresh stats
      fetchAdminStats();

      // Emit socket event for real-time updates
      socket.emit("billCreated", { hotelId, billData });
    } catch (error) {
      console.error("Error creating bill:", error);
      toast.error("Failed to create bill");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      // Header section main existing buttons ke saath yeh button add karo
<div className="flex gap-2">
  {/* Existing buttons yahan honge */}
  
  {/* YEH NAYA BUTTON ADD KARO */}
  <button
    onClick={() => setShowPrinterConfig(true)}
    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
  >
    <FontAwesomeIcon icon={faPrint} className="mr-2" />
    Printer Setup
  </button>
</div>
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="mr-3 text-indigo-600"
                  />
                  Admin Billing
                </h1>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <FontAwesomeIcon
                    icon={faStore}
                    className="mr-2 text-gray-400"
                  />
                  Welcome, {localStorage.getItem("username")} | Hotel ID: #
                  {hotelId}
                </p>
              </div>
            </div>

            {/* Today's Performance Stats */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faReceipt} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">
                      Today's Orders
                    </p>
                    <p className="text-sm font-bold text-blue-800">
                      {todayStats.currentShiftOrders}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faMoneyBillWave}
                    className="text-green-600"
                  />
                  <div>
                    <p className="text-xs text-green-600 font-medium">
                      My Total Revenue
                    </p>
                    <p className="text-sm font-bold text-green-800">
                      ₹{todayStats.myRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-purple-600"
                  />
                  <div>
                    <p className="text-xs text-purple-600 font-medium">
                      Avg Order Value
                    </p>
                    <p className="text-sm font-bold text-purple-800">
                      ₹{Math.round(todayStats.avgOrderValue) || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stats Cards - Visible on smaller screens */}
      <div className="md:hidden bg-white border-b px-4 py-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-2 text-center">
            <FontAwesomeIcon icon={faReceipt} className="text-blue-600 mb-1" />
            <p className="text-xs text-blue-600 font-medium">Today</p>
            <p className="text-sm font-bold text-blue-800">
              {todayStats.currentShiftOrders}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-2 text-center">
            <FontAwesomeIcon
              icon={faMoneyBillWave}
              className="text-green-600 mb-1"
            />
            <p className="text-xs text-green-600 font-medium">Revenue</p>
            <p className="text-sm font-bold text-green-800">
              ₹{Math.round(todayStats.myRevenue) || 0}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-2 py-2 text-center">
            <FontAwesomeIcon
              icon={faChartLine}
              className="text-purple-600 mb-1"
            />
            <p className="text-xs text-purple-600 font-medium">Avg</p>
            <p className="text-sm font-bold text-purple-800">
              ₹{Math.round(todayStats.avgOrderValue) || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Current Order Summary - if items in bill */}
      {billItems.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon
                  icon={faShoppingCart}
                  className="text-indigo-600"
                />
                <span className="text-sm font-medium text-indigo-800">
                  Current Order: {billItems.length} item
                  {billItems.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-sm font-bold text-indigo-800">
                Total: ₹{total.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon
                    icon={faShoppingCart}
                    className="mr-2 text-gray-600"
                  />
                  Menu Selection
                </h2>
              </div>
              <div className="p-6">
                <ProductList
                  products={products}
                  search={search}
                  setSearch={setSearch}
                  handleAddToBill={handleAddToBill}
                  selectedItems={billItems}
                  updateQuantity={handleUpdateQuantity}
                  removeItem={handleRemoveItem}
                />
              </div>
            </div>
          </div>

          {/* Bill Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon
                    icon={faReceipt}
                    className="mr-2 text-gray-600"
                  />
                  Current Bill
                </h2>
              </div>
              <div className="p-6">
                <BillPanel
                  billItems={billItems}
                  total={total}
                  mobileNumber={mobileNumber}
                  setMobileNumber={setMobileNumber}
                  customername={customername}
                  setcustomername={setcustomername}
                  paymentType={paymentType}
                  setPaymentType={setPaymentType}
                  handleSubmitBill={handleCheckout}
                  onRemoveItem={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                  staffName={localStorage.getItem("username")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
{/* Existing PaymentModal ko REPLACE karo with DirectPaymentModal */}
{showModal && (
  <DirectPaymentModal
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    billItems={billItems}
    total={total}
    customername={customername}
    mobileNumber={mobileNumber}
    paymentType={paymentType}
    setPaymentType={setPaymentType}
    handleConfirmPayment={handlePayment}
    hotelInfo={hotelInfo}
    tableNumber={tableNumber}
    diningType={diningType}
    carDetails={carDetails}
    staffName={localStorage.getItem("username")}
  />
)}

      {/* Add this new model */}
{showPrinterConfig && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Printer Configuration</h3>
        <button 
          onClick={() => setShowPrinterConfig(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="p-6">
        <PrinterConfig hotelId={hotelId} />
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminBilling;
