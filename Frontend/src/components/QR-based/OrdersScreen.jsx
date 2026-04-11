import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
const MyOrders = () => {
  const navigate = useNavigate();
  const { hotelId, tableNumber, setActiveTab } = useOutletContext();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); // 🔥 modal state
  const sessionId = sessionStorage.getItem("orderSession");
useEffect(() => {
  const fetchOrders = async () => {
    try {
      console.log("Fetching orders for:", hotelId, tableNumber);

      const res = await axios.get(
  `${import.meta.env.VITE_BACKEND_URL}/api/qrorders/${hotelId}`,
  {
    params: {
      sessionId
    }
  }
);



      const data = await res.data;

      const filtered = data.orders.filter(
        (order) => String(order.table_number) === String(tableNumber)
      );

      setOrders(filtered);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  if (hotelId && tableNumber) {
    fetchOrders();
  }
}, [hotelId, tableNumber]);




  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Orders</h1>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
          onClick={() => {
            setActiveTab("menu");
            navigate(`/customer/${hotelId}/${tableNumber}`);
          }}
        >
          New Order
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No orders created yet 🍽️
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  Order #{order.orderId || index + 1}
                </p>
                <p className="text-sm text-gray-500">
                  Items: {order.items?.length || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Total: ₹{order.total || 0}
                </p>
                <span
      className={`px-2 py-1 rounded text-white text-sm ${
        order.status === "COMPLETED"
          ? "bg-green-500"
          : "bg-yellow-500"
      }`}
    >
      {order.status}
    </span>
              </div>

              {/* 🔥 View Button */}
              <button
                className="px-3 py-1 border border-green-600 text-green-600 rounded-md"
                onClick={() => setSelectedOrder(order)}
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg p-4 relative">
            {/* Close */}
            <button
              className="absolute top-2 right-3 text-xl"
              onClick={() => setSelectedOrder(null)}
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-3">
              Order Details
            </h2>

            <p className="text-sm text-gray-500 mb-2">
              Order ID: {selectedOrder.orderId}
            </p>

            {/* Items */}
            <div className="border rounded-md divide-y">
              {selectedOrder.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between p-2 text-sm"
                >
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between font-semibold mt-4">
              <span>Total</span>
              <span>₹{selectedOrder.total}</span>
            </div>

            <button
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg"
              onClick={() => setSelectedOrder(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===== Footer ===== */}
      <div className="fixed bottom-0 left-0 flex w-full border-t bg-white pt-4 text-center space-y-3">
  {/* Rate Us */}
 <button
  className="text-sm text-yellow-600 font-medium flex items-center justify-center gap-1 mx-auto"
  onClick={() =>
    window.open(
      "https://www.google.com/search?q=zorko+agra+karkunj&rlz=1C5CHFA_enIN1186IN1186&oq=zorko+agra+karkunj&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRigATIHCAIQIRigATIHCAMQIRigATIHCAQQIRiPAjIHCAUQIRiPAtIBCDY0MzZqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8#lrd=0x3974779397784d0d:0x9a7786848c41016,3",
      "_blank"
    )
  }
>
  Rate Us
</button>


  {/* Instagram */}
  <a
    href="https://www.instagram.com/zorkoagra/?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D#"
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-pink-600 font-medium flex items-center justify-center gap-1"
  >
     Visit Instagram
  </a>
</div>

    </div>
  );
};

export default MyOrders;
