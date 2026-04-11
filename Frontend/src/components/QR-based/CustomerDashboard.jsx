import React from "react";
import { useOutletContext } from "react-router-dom";
import MenuScreen from "./MenuScreen";
import OrdersScreen from "./OrdersScreen";
import { CartProvider } from "./CartContext";
import { useEffect } from "react";

const CustomerDashboard = () => {
  const { activeTab, hotelId, tableNumber } = useOutletContext();
  useEffect(() => {
  let sessionId = sessionStorage.getItem("orderSession");

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("orderSession", sessionId);
  }
}, []);

  return (
    <CartProvider>
      {activeTab === "menu" && <MenuScreen />}
     
      {activeTab === "orders" && <OrdersScreen />}
    </CartProvider>
  );
};

export default CustomerDashboard;
