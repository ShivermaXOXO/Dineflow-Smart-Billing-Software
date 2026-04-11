import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/authContext";
import socket from "../../services/socket";
import ProductList from "../staff/ProductList";
import BillPanel from "../staff/BillPanel";
import OrderManagement from "../staff/OrderManagement";
import NewOrderDialog from "../staff/NewOrderDialog";
import DirectPaymentModal from '../staff/DirectPaymentModal';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faReceipt,
  faShoppingCart,
  faMoneyBillWave,
  faStore,
  faChartLine,
  faTimes,
  faSync,
  faPrint,
  faPlug,
  faWifi,
  faSignal,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import printerService from "../../services/printerService";

// Utility function to generate unique IDs for bill items
const generateUniqueId = () =>
  `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const AdminBilling = ({ hotelId }) => {
  const { auth } = useAuth();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [billItems, setBillItems] = useState([]);
    const [finalTotal, setFinalTotal] = useState(0);
  const [mobileNumber, setMobileNumber] = useState("");
  const [customername, setcustomername] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mobileBillView, setMobileBillView] = useState(null);
  const [todayStats, setTodayStats] = useState({
    myOrders: 0,
    myRevenue: 0,
    currentShiftOrders: 0,
    avgOrderValue: 0,
  });

  // Tax and table number states
  const [tableNumber, setTableNumber] = useState("");
  const [addTax, setAddTax] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);

  // New state for dining type and car details
  const [diningType, setDiningType] = useState("");
  const [carDetails, setCarDetails] = useState("");

  // Hotel information state
  const [hotelInfo, setHotelInfo] = useState({});

  // Add a force update counter for form reset
  const [formResetCounter, setFormResetCounter] = useState(0);

  // Order management states
  const [showMenuSection, setShowMenuSection] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [ordercustomername, setOrdercustomername] = useState("");
  const [orderMobileNumber, setOrderMobileNumber] = useState("");
  const [orderDiningType, setOrderDiningType] = useState("");
  const [orderTableNumber, setOrderTableNumber] = useState("");
  const [orderCarDetails, setOrderCarDetails] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Bill panel visibility state
  const [showBillPanel, setShowBillPanel] = useState(false);

  // New order dialog state
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [editingOrderForDialog, setEditingOrderForDialog] = useState(null);

  // Printer connection state
  const [printerStatus, setPrinterStatus] = useState("Click to connect printer");
  const [isConnectingToPrinter, setIsConnectingToPrinter] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [showPrinterList, setShowPrinterList] = useState(false);

  // Ref for scrolling to menu section
  const menuSectionRef = useRef(null);

  // Add state to track if current bill came from an order
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const total = billItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxAmount = addTax ? (total * taxPercentage) / 100 : 0;
  const calculatedFinalTotal = addTax ? total + taxAmount : total;

useEffect(() => {
  const taxAmount = addTax ? (total * taxPercentage) / 100 : 0;
  setFinalTotal(addTax ? total + taxAmount : total);
}, [total, addTax, taxPercentage]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/${hotelId}`
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  // Fetch admin stats
  const fetchAdminStats = async () => {
    try {
      const adminId = parseInt(
        localStorage.getItem("staffId") || localStorage.getItem("userId") || "1"
      );
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/admin-stats/${parseInt(
          hotelId
        )}/${adminId}`
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
      setTodayStats({
        myOrders: 0,
        myRevenue: 0,
        currentShiftOrders: 0,
        avgOrderValue: 0,
      });
    }
  };

  // Simplified printer connection function with disconnect capability
  const handleConnectPrinter = async () => {
    try {
      console.log("🖨️ Connect Printer button clicked");
      
      // Check if we have a REAL connected printer (not browser fallback)
      const hasRealConnection = printerService.isConnected && 
                               printerService.selectedPrinter?.connected && 
                               printerService.selectedPrinter?.type !== 'browser';

      if (hasRealConnection) {
        console.log("📤 Disconnecting current printer...");
        setIsConnectingToPrinter(true);
        const result = await printerService.disconnectPrinter();
        setPrinterStatus('Printer disconnected');
        toast.info('Printer disconnected');
        setIsConnectingToPrinter(false);
        return;
      }

      // Start direct connection process
      setIsConnectingToPrinter(true);
      setPrinterStatus('Searching for printers...');

      const result = await printerService.connectPrinter();
      
      if (result.success) {
        setPrinterStatus(`Connected to ${result.printer.name}`);
        setShowPrinterList(false);
        toast.success(`✅ ${result.message}`);
      } else {
        setPrinterStatus(result.message);
        toast.error(`❌ ${result.message}`);
        
        // Show available printers if connection fails but devices were found
        if (printerService.availablePrinters.length > 0) {
          setAvailablePrinters(printerService.availablePrinters);
          setShowPrinterList(true);
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage = error.message || 'Failed to connect to printer';
      setPrinterStatus(errorMessage);
      toast.error(`❌ ${errorMessage}`);
      
      // Show available printers if any were found
      if (printerService.availablePrinters.length > 0) {
        setAvailablePrinters(printerService.availablePrinters);
        setShowPrinterList(true);
      }
    } finally {
      setIsConnectingToPrinter(false);
    }
  };

  // Handle printer connection from list
  const handleConnectToPrinter = async (printer) => {
    try {
      setIsConnectingToPrinter(true);
      setPrinterStatus(`Connecting to ${printer.name}...`);

      const result = await printerService.connectToPrinter(printer);

      if (result.success) {
        setPrinterStatus(result.message);
        setShowPrinterList(false);
        toast.success(`✅ ${result.message}`);
        
        // Update available printers list to show connected status
        const updatedPrinters = await printerService.detectAllPrinters();
        setAvailablePrinters(updatedPrinters);
      } else {
        setPrinterStatus(result.message);
        toast.error(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage = error.message || 'Failed to connect to printer';
      setPrinterStatus(errorMessage);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsConnectingToPrinter(false);
    }
  };

  // Manual printer reconnection
  const handleReconnectPrinter = async () => {
    console.log("🔁 Manual reconnection requested");
    await handleConnectPrinter();
  };

  // Update printer status when printer service state changes
  useEffect(() => {
    const updatePrinterStatus = () => {
      const hasRealConnection = printerService.isConnected && 
                               printerService.selectedPrinter?.connected && 
                               printerService.selectedPrinter?.type !== 'browser';
      
      if (hasRealConnection) {
        setPrinterStatus(`Connected to ${printerService.selectedPrinter.name}`);
      } else {
        setPrinterStatus("Click to connect printer");
      }
    };

    // Check status every 3 seconds
    const interval = setInterval(updatePrinterStatus, 3000);
    
    // Initial check
    updatePrinterStatus();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hotelId) {
      fetchProducts();
      fetchAdminStats();

      // Check printer status
      const checkPrinterStatus = () => {
        const hasRealConnection = printerService.isConnected && 
                                 printerService.selectedPrinter?.connected && 
                                 printerService.selectedPrinter?.type !== 'browser';
        
        if (hasRealConnection) {
          setPrinterStatus(`Connected to ${printerService.selectedPrinter.name}`);
        } else {
          setPrinterStatus("Click to connect printer");
        }
      };

      checkPrinterStatus();

      // Fetch hotel information
      const fetchHotelInfo = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/hotels/${hotelId}`
          );
          const { name, address, gstin, profileImage } = res.data;
          setHotelInfo({ name, address, gstin, profileImage });
        } catch (error) {
          console.error("Hotel info fetch error:", error);
          toast.error("Failed to load hotel information");
        }
      };

      fetchHotelInfo();

      // Set up socket connection for real-time updates
      socket.connect();
      socket.emit("joinHotelRoom", hotelId);

      // Listen for bill creation events to refresh stats
      socket.on("billCreated", () => {
        fetchAdminStats();
      });
    }

    return () => {
      socket.off("billCreated");
    };
  }, [hotelId]);

  // Add item to bill
  const handleAddToBill = (product) => {
    const existingItem = billItems.find(
      (item) => (item.productId || item.id) === product.id
    );

    if (existingItem) {
      setBillItems(
        billItems.map((item) =>
          (item.productId || item.id) === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setBillItems([
        ...billItems,
        {
          id: generateUniqueId(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  // Remove item from bill
  const handleRemoveItem = (itemId) => {
    setBillItems(billItems.filter((item) => item.id !== itemId));
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setBillItems(
        billItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
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

  // Enhanced payment handler with automatic printing
  const handlePayment = async () => {
    try {
      if (!paymentType) {
        toast.warning("Please select a payment method");
        return;
      }

      const billData = {
        customername: customername || "Walk-in Customer",
        phoneNumber: mobileNumber || "N/A",
        items: billItems.map((item) => ({
          productId: item.productId || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: total,
        paymentType,
        hotelId: parseInt(hotelId),
        staffId: parseInt(
          localStorage.getItem("staffId") ||
          localStorage.getItem("userId") ||
          "1"
        ),
        tableNumber: diningType === "dine-in" ? tableNumber || null : null,
        diningType: diningType || null,
        carDetails: diningType === "takeaway" ? carDetails || null : null,
        addTax,
        taxPercentage: addTax ? taxPercentage : 0,
        taxAmount: addTax ? (total * taxPercentage) / 100 : 0,
        finalTotal: finalTotal,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/create`,
        billData
      );

      // If this bill was created from an existing order, delete the order
  // Instead of deleting, update order status to 'billed'
if (currentOrderId) {
  try {
    await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/orders/${currentOrderId}/status`,
      { status: 'completed', finalTotal: billData.finalTotal }
    );
    console.log("Order marked as completed");
  } catch (error) {
    console.error("Failed to update order status:", error);
  }
}

      toast.success("Bill created successfully!");

      // Auto-print the bill
      if (autoPrintEnabled) {
        await handleAutoPrint(billData);
      }

      // Reset form and close modal
      setBillItems([]);
      setMobileNumber("");
      setcustomername("");
      setPaymentType("");
      setTableNumber("");
      setAddTax(false);
      setTaxPercentage(0);
      setCurrentOrderId(null);
      setShowModal(false);
      setMobileBillView(false);

      // Refresh stats
      setTimeout(() => {
        fetchAdminStats();
      }, 500);
      setRefreshKey((prev) => prev + 1);

      // Emit socket event for real-time updates
      socket.emit("billCreated", { hotelId, billData });

    } catch (error) {
      console.error("Error creating bill:", error);
      toast.error("Failed to create bill");
    }
  };

  // Automatic printing function
  const handleAutoPrint = async (billData) => {
    try {
      // Safety check for printer service
      if (!printerService || typeof printerService.printBill !== 'function') {
        console.error('❌ Printer service not available');
        toast.warning("Bill created but printing service unavailable");
        return;
      }

      // Prepare bill data for printing
      const printBillData = {
        hotelName: hotelInfo?.name || 'DineFlow Restaurant',
        hotelAddress: hotelInfo?.address || '',
        hotelContact: hotelInfo?.contact || '',
        billNumber: `BL-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        customername: billData.customername,
        tableNumber: billData.tableNumber || (billData.diningType === 'takeaway' ? 'Takeaway' : 'N/A'),
        items: billData.items.map(item => ({
          name: item.name.substring(0, 20),
          quantity: item.quantity,
          price: `₹${item.price.toFixed(2)}`,
          total: `₹${(item.price * item.quantity).toFixed(2)}`
        })),
        subtotal: `₹${billData.total.toFixed(2)}`,
        tax: `₹${(billData.taxAmount || 0).toFixed(2)}`,
        taxRate: billData.taxPercentage?.toString() || '0',
        grandTotal: `₹${billData.finalTotal.toFixed(2)}`,
        paymentMethod: billData.paymentType.toUpperCase()
      };

      console.log('🖨️ Attempting to print bill...', printBillData);

      // Use the main printBill method
      const printResult = await printerService.printBill(printBillData);
      console.log('✅ Print result:', printResult);
      
      if (printResult.success) {
        toast.success("Bill printed automatically!");
      } else {
        toast.warning("Bill created but printing failed");
      }

    } catch (printError) {
      console.error("Auto-print failed:", printError);
      toast.warning("Bill created but printing failed");
    }
  };

  // Order Management Functions
  const handleNewOrder = () => {
    setShowNewOrderDialog(true);
  };

  // Handle order creation from the new dialog
  const handleOrderCreated = (newOrder) => {
    setRefreshKey((prev) => prev + 1);
    setShowNewOrderDialog(false);
    setEditingOrderForDialog(null);
  };

  const handleOrderUpdated = (updatedOrder) => {
    setRefreshKey((prev) => prev + 1);
    setShowNewOrderDialog(false);
    setEditingOrderForDialog(null);
  };

  const handleUpdateOrder = (order) => {
    setEditingOrderForDialog(order);
    setShowNewOrderDialog(true);
  };

  const handleAddToOrder = (product) => {
    const existingItem = orderItems.find((item) => item.id === product.id);

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveOrderItem = (productId) => {
    setOrderItems(orderItems.filter((item) => item.id !== productId));
  };

  const updateOrderItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveOrderItem(productId);
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleSaveOrder = async () => {
    try {
      if (orderItems.length === 0) {
        toast.warning("Please add items to the order");
        return;
      }

      const orderData = {
        customername: ordercustomername.trim() || "Walk-in Customer",
        phoneNumber: orderMobileNumber || "N/A",
        tableNumber: orderTableNumber,
        diningType: orderDiningType,
        carDetails: orderCarDetails,
        items: orderItems.map((item) => ({
          productId: item.id,
          name: item.name,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        hotelId: parseInt(hotelId),
        staffId: parseInt(
          localStorage.getItem("staffId") ||
          localStorage.getItem("userId") ||
          "1"
        ),
        status: "pending",
      };

      if (editingOrder) {
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/${editingOrder.id}`,
          orderData
        );
        toast.success("Order updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders`,
          orderData
        );
        toast.success("Order saved successfully!");
      }

      // Reset form
      setShowMenuSection(false);
      setOrderItems([]);
      setOrdercustomername("");
      setOrderMobileNumber("");
      setOrderDiningType("");
      setOrderTableNumber("");
      setOrderCarDetails("");
      setEditingOrder(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Failed to save order");
    }
  };

  // Function to clear billing form
  const clearBillingForm = () => {
    setBillItems([]);
    setcustomername("");
    setMobileNumber("");
    setPaymentType("");
    setTableNumber("");
    setAddTax(false);
    setTaxPercentage(0);
    setCurrentOrderId(null);
    setShowBillPanel(false);
    setMobileBillView(false);
  };

  const loadOrderToBill = (orderOrBillData) => {
    let items, customername, phoneNumber;

    if (orderOrBillData.items && Array.isArray(orderOrBillData.items)) {
      items = orderOrBillData.items;
      customername = orderOrBillData.customername;
      phoneNumber = orderOrBillData.phoneNumber;
    } else if (orderOrBillData.items) {
      items = orderOrBillData.items;
      customername = orderOrBillData.customername;
      phoneNumber = orderOrBillData.phoneNumber;
    }

    if (!items || !Array.isArray(items)) {
      console.error("Invalid items data:", items);
      toast.error("Error: Invalid order data");
      return;
    }

    const mappedItems = items.map((item) => ({
      id: generateUniqueId(),
      productId: item.productId || item.id,
      name: item.name || item.productName,
      price: item.price,
      quantity: item.quantity,
    }));

    setBillItems(mappedItems);
    setcustomername(customername || "");
    setMobileNumber(phoneNumber !== "N/A" ? phoneNumber || "" : "");
    setPaymentType("");
    setTableNumber(orderOrBillData.tableNumber || "");
    setAddTax(false);
    setTaxPercentage(0);
    setDiningType(orderOrBillData.diningType || "");
    setCarDetails("");
    setCurrentOrderId(orderOrBillData.orderId || orderOrBillData.id);
    setShowBillPanel(true);
    setFormResetCounter((prev) => prev + 1);

    // Mobile Check
    if (window.innerWidth < 1024) {
      setMobileBillView(true);
      setShowBillPanel(false);
    } else {
      setMobileBillView(false);
      setShowBillPanel(true);
    }
  }

const handleDeleteOrder = async (orderId) => {
  try {
    // Parallel API calls for better performance
    await Promise.all([
      axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}`),
      axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/bills/${orderId}`)
    ]);
    
    toast.success("Order and bill deleted successfully!");
    setRefreshKey((prev) => prev + 1);
  } catch (error) {
    console.error("Error deleting order/bill:", error);
    toast.error("Failed to delete order and bill");
  }
};

  // Helper function to check if we have a real printer connection
  const hasRealPrinterConnection = () => {
    return printerService.isConnected && 
           printerService.selectedPrinter?.connected && 
           printerService.selectedPrinter?.type !== 'browser';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileBillView && (
        <div className="fixed inset-0 bg-gray-50 z-[40] flex flex-col lg:hidden animate-slide-in">
          {/* Header */}
          <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10 border-b">
            <button
              onClick={() => setMobileBillView(false)} 
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Current Bill</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <BillPanel
                billItems={billItems}
                total={total}
                finalTotal={finalTotal}
                setFinalTotal={setFinalTotal}
                mobileNumber={mobileNumber}
                setMobileNumber={setMobileNumber}
                customername={customername}
                setcustomername={setcustomername}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
                addTax={addTax}
                setAddTax={setAddTax}
                taxPercentage={taxPercentage}
                setTaxPercentage={setTaxPercentage}
                handleSubmitBill={handleCheckout}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                staffName={localStorage.getItem("username")}
                diningType={diningType}
                setDiningType={setDiningType}
                carDetails={carDetails}
                setCarDetails={setCarDetails}
              />
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className={mobileBillView ? 'hidden lg:block' : 'block'}>
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
              className="
            flex items-center justify-between h-auto py-4 
            max-[910px]:flex-col max-[910px]:items-start max-[910px]:gap-4
          "
            >

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

            {/* Printer Status & Today's Performance Stats */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Printer Status with Connect Button */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faPrint} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Printer</p>
                    <button
                      onClick={handleConnectPrinter}
                      disabled={isConnectingToPrinter}
                      className={`text-sm font-bold ${
                        hasRealPrinterConnection()
                          ? 'text-green-800 hover:text-green-900'
                          : 'text-blue-800 hover:text-blue-900'
                      } transition-colors disabled:opacity-50`}
                      title={
                        hasRealPrinterConnection() 
                          ? "Click to disconnect" 
                          : "Click to connect printer"
                      }
                    >
                      {isConnectingToPrinter 
                        ? 'Connecting...' 
                        : hasRealPrinterConnection() 
                          ? `Connected to ${printerService.selectedPrinter?.name || 'Printer'}`
                          : 'Connect Printer'
                      }
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faReceipt} className="text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">
                      Completed Bills
                    </p>
                    <p className="text-sm font-bold text-green-800">
                      {todayStats.myOrders}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faShoppingCart}
                    className="text-indigo-600"
                  />
                  <div>
                    <p className="text-xs text-indigo-600 font-medium">
                      Total Orders
                    </p>
                    <p className="text-sm font-bold text-indigo-800">
                      {todayStats.currentShiftOrders}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faMoneyBillWave}
                    className="text-purple-600"
                  />
                  <div>
                    <p className="text-xs text-purple-600 font-medium">
                      My Total Revenue
                    </p>
                    <p className="text-sm font-bold text-purple-800">
                      ₹{todayStats.myRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stats Cards */}
      <div className="md:hidden bg-white border-b px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          <div
            className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-2 text-center cursor-pointer"
            onClick={handleConnectPrinter}
          >
            <FontAwesomeIcon icon={faPrint} className="text-blue-600 mb-1" />
            <p className="text-xs text-blue-600 font-medium">Printer</p>
            <p className="text-xs font-bold text-blue-800">
              {hasRealPrinterConnection() ? 'Connected' : 'Connect'}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-2 text-center">
            <FontAwesomeIcon icon={faReceipt} className="text-green-600 mb-1" />
            <p className="text-xs text-green-600 font-medium">Bills</p>
            <p className="text-xs font-bold text-green-800">
              {todayStats.myOrders}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-2 py-2 text-center">
            <FontAwesomeIcon
              icon={faMoneyBillWave}
              className="text-purple-600 mb-1"
            />
            <p className="text-xs text-purple-600 font-medium">Revenue</p>
            <p className="text-xs font-bold text-purple-800">
              ₹{Math.round(todayStats.myRevenue) || 0}
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-2 text-center">
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="text-indigo-600 mb-1"
            />
            <p className="text-xs text-indigo-600 font-medium">Orders</p>
            <p className="text-xs font-bold text-indigo-800">
              {todayStats.currentShiftOrders}
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
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${mobileBillView ? 'hidden lg:block' : ''}`}>
        <div
          className={`grid gap-6 ${showBillPanel ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
            }`}
        >
          {/* Order Management Section - Primary */}
          <div
            className={`${showBillPanel ? "lg:col-span-2" : "col-span-1"
              } order-2 lg:order-1`}
          >
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-4 py-4 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className=" text-lg font-semibold text-gray-900
                                flex items-center
                              ">
                  <FontAwesomeIcon
                    icon={faShoppingCart}
                    className="mr-2 text-gray-600"
                  />
                  Order Management
                </h2>
                  <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                  {!showBillPanel && (
                    <button
                        onClick={() => {
                          if (window.innerWidth < 1024) setMobileBillView(true);
                          else setShowBillPanel(true);
                        }}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm font-medium shadow-sm"
                      >
                        <FontAwesomeIcon icon={faReceipt} className="mr-2" />
                        Bill Panel
                      </button>
                    )}
                    <button
                      onClick={handleNewOrder} 
                      className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-sm font-medium shadow-sm"
                    >
                      <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                      New Order
                    </button>
                    <button 
                      onClick={() => setRefreshKey(prev => prev + 1)} 
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm font-medium shadow-sm"
                    >
                      <FontAwesomeIcon icon={faSync} className="mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <OrderManagement
                    key={refreshKey}
                    hotelId={hotelId}
                    staffId={localStorage.getItem("staffId") || localStorage.getItem("userId") || "1"}
                    onLoadOrderToBill={loadOrderToBill}
                    onNewOrderClick={handleNewOrder}
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={handleDeleteOrder}
                    isAdmin={true}
                  />
                </div>
            </div>
          </div>

          {/* Bill Panel - Conditionally Rendered */}
            {showBillPanel && !mobileBillView && (
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="bg-white rounded-lg shadow-sm border sticky top-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FontAwesomeIcon
                        icon={faReceipt}
                        className="mr-2 text-gray-600"
                      />
                      Current Bill
                    </h2>
                    <button
                      onClick={clearBillingForm}
                      className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center"
                      title="Start a new bill"
                    >
                      <FontAwesomeIcon icon={faTimes} className="mr-1" />
                      New Bill
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <BillPanel
                    key={`admin-bill-${formResetCounter}-${currentOrderId || "new"
                      }`}
                    billItems={billItems}
                    total={total}
                    finalTotal={finalTotal}
                    setFinalTotal={setFinalTotal}
                    mobileNumber={mobileNumber}
                    setMobileNumber={setMobileNumber}
                    customername={customername}
                    setcustomername={setcustomername}
                    paymentType={paymentType}
                    setPaymentType={setPaymentType}
                    tableNumber={tableNumber}
                    setTableNumber={setTableNumber}
                    addTax={addTax}
                    setAddTax={setAddTax}
                    taxPercentage={taxPercentage}
                    setTaxPercentage={setTaxPercentage}
                    handleSubmitBill={handleCheckout}
                    onRemoveItem={handleRemoveItem}
                    onUpdateQuantity={handleUpdateQuantity}
                    staffName={localStorage.getItem("username")}
                    diningType={diningType}
                    setDiningType={setDiningType}
                    carDetails={carDetails}
                    setCarDetails={setCarDetails}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      {/* Direct Payment Modal */}
      <DirectPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        billItems={billItems}
        total={total}
        taxPercentage={taxPercentage}
        finalTotal={finalTotal} 
        customername={customername}
        mobileNumber={mobileNumber}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        handleConfirmPayment={handlePayment}
        hotelInfo={hotelInfo}
        tableNumber={tableNumber}
        diningType={diningType}
        printerStatus={printerStatus}
        autoPrintEnabled={autoPrintEnabled}
        setAutoPrintEnabled={setAutoPrintEnabled}
        isConnectingToPrinter={isConnectingToPrinter}
        onReconnectPrinter={handleReconnectPrinter}
      />

      {/* New Order Dialog */}
      <NewOrderDialog
        isOpen={showNewOrderDialog}
        onClose={() => {
          setShowNewOrderDialog(false);
          setEditingOrderForDialog(null);
        }}
        role={auth.role}
        hotelId={hotelId}
        onOrderCreated={handleOrderCreated}
        editingOrder={editingOrderForDialog}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* Simplified Printer List Modal */}
      {showPrinterList && availablePrinters.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Available Printers</h3>
              <button
                onClick={() => setShowPrinterList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availablePrinters.map((printer) => (
                <div
                  key={printer.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon
                      icon={
                        printer.type === 'usb' ? faPlug : 
                        printer.type === 'network' ? faWifi : faSignal
                      }
                      className={
                        printer.type === 'usb' ? 'text-green-600' :
                        printer.type === 'network' ? 'text-blue-600' : 'text-purple-600'
                      }
                    />
                    <div>
                      <p className="font-medium">{printer.name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {printer.type} Printer
                        {printer.connected && ' • Connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnectToPrinter(printer)}
                    disabled={isConnectingToPrinter || printer.connected}
                    className={`px-3 py-1 rounded text-sm ${
                      printer.connected
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {printer.connected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPrinterList(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBilling;