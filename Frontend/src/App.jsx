import { Routes, Route } from "react-router-dom";
import React from "react";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import CounterDashboard from "./pages/CounterDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminStaffPage from "./pages/SuperAdminStaffPage";
import SuperAdminOrdersPage from "./pages/SuperAdminOrdersPage";
import AddStaffPage from "./pages/AddStaffPage";
import AddHotelPage from "./pages/AddHotelPage";
import SuperAdminLogin from "./components/superAdmin/SuperAdminLogin";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import CustomerLayout from "./components/QR-based/CustomerLayout";
import CustomerDashboard from "./components/QR-based/CustomerDashboard";
import AdminOrders from "./components/QR-based/admin";
import GenerateBillPreview from "./components/counter/GenerateBillPreview";
function App() {
  return (
    <Routes>

      {/* ================= CUSTOMER (QR BASED) ================= */}
      <Route path="/customer/:hotelId/:tableNumber" element={<CustomerLayout />}>
        <Route index element={<CustomerDashboard />} />
      </Route>
      <Route path="/qradmin-login" element={<LoginPage />} />
      <Route path="/qradmin/:hotelId" element={<AdminOrders />} />

      {/* ================= PUBLIC ================= */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <HomePage />
            <Footer />
          </>
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/superadminlogin" element={<SuperAdminLogin />} />

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin/:hotelId"
        element={
          <>
            <Navbar />
            <AdminDashboard />
            <Footer />
          </>
        }
      />

      <Route
        path="/staff/:hotelId"
        element={
          <>
            <Navbar />
            <StaffDashboard />
            <Footer />
          </>
        }
      />

      <Route
        path="/counter/:hotelId"
        element={
          <>
            <Navbar />
            <CounterDashboard />
            <Footer />
          </>
        }
      />

      {/* ================= SUPER ADMIN ================= */}
      <Route
        path="/superadmin"
        element={
          <>
            <Navbar />
            <SuperAdminDashboard />
            <Footer />
          </>
        }
      />

      <Route
        path="/superadmin/staff/:hotelId"
        element={
          <>
            <Navbar />
            <SuperAdminStaffPage />
            <Footer />
          </>
        }
      />

      <Route
        path="/superadmin/orders/:hotelId"
        element={
          <>
            <Navbar />
            <SuperAdminOrdersPage />
            <Footer />
          </>
        }
      />

      <Route
        path="/superadmin/add-staff/:hotelId"
        element={
          <>
            <Navbar />
            <AddStaffPage />
            <Footer />
          </>
        }
      />

      <Route
        path="/superadmin/add-hotel"
        element={
          <>
            <Navbar />
            <AddHotelPage />
            <Footer />
          </>
        }
      />
      <Route path="/generate-bill-preview" element={<GenerateBillPreview />} />
    </Routes>
  );
}

export default App;
