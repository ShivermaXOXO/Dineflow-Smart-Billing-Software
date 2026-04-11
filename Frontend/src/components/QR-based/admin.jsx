import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext"
import { Outlet, useParams } from "react-router-dom";
import AddMenu from "./AddMenu";
import UpdateMenu from "./UpdateMenu";
import axios from "axios";
const AdminDashboard = () => {
  const navigate = useNavigate();
const { logout } = useAuth();

const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

const handleLogout = () => setShowLogoutConfirm(true);

const handleLogoutConfirm = () => {
  logout();
  setShowLogoutConfirm(false);
  navigate("/qradmin-login", { replace: true });
};

const handleStayLoggedIn = () => setShowLogoutConfirm(false);

  const { hotelId } = useParams();
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
const [showCurrentOrders, setShowCurrentOrders] = useState(true);
const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch data from localStorage
useEffect(() => {
  let intervalId;

  const fetchOrders = async () => {
    try {
      console.log("Fetching orders for hotelId:", hotelId);
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/qrorders/all/${hotelId}`
      );

      console.log("Response data:", res.data);
      const allOrders = res.data.orders || [];

      const pending = allOrders
        .filter(o => o.status === "pending")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const completed = allOrders
        .filter(o => o.status === "completed")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOrders(pending);
      setCompletedOrders(completed);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  if (hotelId) {
    fetchOrders(); // initial fetch
    intervalId = setInterval(fetchOrders, 2000); // fetch every 2 seconds
  }

  return () => clearInterval(intervalId); // cleanup on unmount or hotelId change
}, [hotelId]);



const markAccepted = async (orderId) => {
  if (!orderId) {
    console.error("Order ID missing");
    return;
  }
  console.log("Marking order as accepted:", orderId);
  try {
    await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/qrorders/update/${orderId}`
    );
    console.log("Order marked as accepted");
    // UI update
    setOrders(prev => prev.filter(o => o.order_id !== orderId));
    setCompletedOrders(prev => [
      ...prev,
      orders.find(o => o.order_id === orderId)
    ]);
  } catch (err) {
    console.error("Failed to update order", err);
  }
};


  // Add Menu Item
  const addMenuItem = (item) => {
    const newMenu = [...menuItems, item];
    setMenuItems(newMenu);
    localStorage.setItem("menu", JSON.stringify(newMenu));
  };

  // Update Menu Item
  const updateMenuItem = (index, updatedItem) => {
    const newMenu = [...menuItems];
    newMenu[index] = updatedItem;
    setMenuItems(newMenu);
    localStorage.setItem("menu", JSON.stringify(newMenu));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow">
        <div className="flex items-center space-x-2"> Hotel Id: {hotelId}</div>
        <div className="font-medium">Welcome, Admin</div>
        <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleLogoutConfirm}>Logout</button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-gray-200">
        {["dashboard", "addMenu", "updateMenu"].map((t) => (
          <button
            key={t}
            className={`flex-1 py-2 font-medium ${
              tab === t ? "bg-white" : ""
            }`}
            onClick={() => setTab(t)}
          >
            {t === "dashboard"
              ? "Dashboard"
              : t === "addMenu"
              ? "Add Menu"
              : "Update Menu"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Dashboard Tab */}
        {tab === "dashboard" && (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {showCurrentOrders ? "Current Orders" : "Completed Orders"}
      </h3>

      <button
        onClick={() => setShowCurrentOrders(!showCurrentOrders)}
        className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all duration-300 transform hover:scale-105"
      >
        <span className="text-sm font-medium">
          Switch to {showCurrentOrders ? "Completed Orders" : "Current Orders"}
        </span>
      </button>
    </div>

    {/* Animated Content */}
    <div className="relative overflow-hidden">
      {/* CURRENT ORDERS */}
      <div
        className={`transition-all duration-500 ease-in-out transform ${
          showCurrentOrders
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 absolute inset-0"
        }`}
      >
        {orders.length === 0 && (
          <div className="text-gray-500 text-sm">No pending orders.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

  {orders.map((order) => (
    <div
      key={order.orderId}
     className="bg-white border rounded-xl shadow-sm p-4 sm:p-6 flex flex-col justify-between hover:shadow-md transition"
 >
      {/* Table Info */}
      <div>
        <p className="text-gray-500 text-sm">Table</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">

          {order.table_number}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mt-4">

        <button
          onClick={() => setSelectedOrder(order)}
         className="w-full sm:w-auto px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm">

          View Order
        </button>

        <button
          onClick={() => markAccepted(order.order_id)}
          className="w-full sm:w-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm">
          Accept
        </button>
      </div>
    </div>
  ))}
</div>

      </div>

      {/* COMPLETED ORDERS */}
      <div
        className={`transition-all duration-500 ease-in-out transform ${
          !showCurrentOrders
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 absolute inset-0"
        }`}
      >
        {completedOrders.length === 0 && (
          <div className="text-gray-500 text-sm">
            No completed orders yet.
          </div>
        )}

        <div className="space-y-3">
          {completedOrders.map((order) => (
            <div
              key={order.orderId}
              className="p-4 border rounded-lg bg-green-50"
            >
              <p className="font-medium">
                Table {order.table_number} • ₹{order.total}
              </p>
              <p className="text-sm text-gray-600">
                {order.items.map((i) => i.name).join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}
{selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white w-full sm:max-w-md rounded-xl p-4 sm:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-2">
        Table {selectedOrder.tableNumber}
      </h3>

      {/* Items */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {selectedOrder.items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between text-sm border-b pb-1"
          >
            <span>
              {item.name} × {item.qty}
            </span>
            <span>₹{item.price * item.qty}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between font-semibold mt-4 text-lg">
        <span>Total</span>
        <span>₹{selectedOrder.total}</span>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setSelectedOrder(null)}
          className="px-4 py-2 border rounded-lg"
        >
          Close
        </button>

      
      </div>
    </div>
  </div>
)}
 
        {/* Add Menu Tab */}
        {tab === "addMenu" && (
          <AddMenu addMenuItem={addMenuItem} />
        )}

        {/* Update Menu Tab */}
        {tab === "updateMenu" && (
          <UpdateMenu menuItems={menuItems} updateMenuItem={updateMenuItem} />
        )}
      </div>
      {showLogoutConfirm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
      <div className="flex items-center mb-4">
        <FontAwesomeIcon
          icon={faWarning}
          className="text-yellow-500 text-xl mr-3"
        />
        <h3 className="text-lg font-semibold text-gray-900">
          Confirm Logout
        </h3>
      </div>

      <p className="text-gray-600 mb-6">
        Are you sure you want to logout?
      </p>

      <div className="flex justify-end space-x-3">
        <button
          onClick={handleStayLoggedIn}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
        >
          Stay Logged In
        </button>
        <button
          onClick={handleLogoutConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default AdminDashboard;
