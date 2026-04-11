import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import printerService from '../../services/printerService';
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';

const HotelOrdersList = ({ hotelId, selectedDate, dateRange }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [error, setError] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  // Add state for recycle bin
  const [recycleBin, setRecycleBin] = useState([]);
  
  // Toggle switch state - similar to DailyReport
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  
  // Export state
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportType, setExportType] = useState('download');

  // Printer state
  const [printerStatus, setPrinterStatus] = useState("Printer not connected");
  const [isConnectingToPrinter, setIsConnectingToPrinter] = useState(false);
  const [hotelInfo, setHotelInfo] = useState({});

  // Calculate default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setExportEndDate(end.toISOString().split('T')[0]);
    setExportStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Auto-cleanup for old recycle bin items (older than 7 days)
  useEffect(() => {
    const cleanupOldRecycleBinItems = () => {
      try {
        const savedRecycleBin = localStorage.getItem(`hotel_${hotelId}_recycle_bin`);
        if (!savedRecycleBin) return;
        
        const recycleBinData = JSON.parse(savedRecycleBin);
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const filteredRecycleBin = recycleBinData.filter(item => 
          new Date(item.deletedAt).getTime() > sevenDaysAgo
        );
        
        if (filteredRecycleBin.length !== recycleBinData.length) {
          const deletedCount = recycleBinData.length - filteredRecycleBin.length;
          localStorage.setItem(`hotel_${hotelId}_recycle_bin`, JSON.stringify(filteredRecycleBin));
          setRecycleBin(filteredRecycleBin);
          console.log(`🗑️ Automatically cleaned up ${deletedCount} old items from recycle bin (older than 7 days)`);
        }
      } catch (error) {
        console.error('Error cleaning up recycle bin:', error);
      }
    };
    
    // Run cleanup once when component mounts and when recycle bin changes
    if (hotelId) {
      cleanupOldRecycleBinItems();
    }
  }, [hotelId, recycleBin]);

  // Load recycle bin on component mount
  useEffect(() => {
    if (hotelId) {
      loadRecycleBin();
    }
  }, [hotelId]);

  // Fetch hotel information for printing
  const fetchHotelInfo = async () => {
    if (!hotelId) return;
    
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/hotels/${hotelId}`
      );
      const { name, address, gstin, profileImage, contact } = res.data;
      setHotelInfo({ 
        name: name || 'Hotel', 
        address: address || '', 
        gstin: gstin || '', 
        profileImage, 
        contact: contact || '' 
      });
    } catch (error) {
      console.error("Hotel info fetch error:", error);
      setHotelInfo({
        name: 'Hotel',
        address: '',
        gstin: '',
        contact: ''
      });
    }
  };

  // Check printer status
  const checkPrinterStatus = () => {
    const hasRealConnection = printerService.isConnected && 
                             printerService.selectedPrinter?.connected && 
                             printerService.selectedPrinter?.type !== 'browser';
    
    if (hasRealConnection) {
      setPrinterStatus(`Connected to ${printerService.selectedPrinter.name}`);
    } else {
      setPrinterStatus("Printer not connected");
    }
  };

  // Connect printer function
  const handleConnectPrinter = async () => {
    try {
      console.log("🖨️ Connect Printer button clicked");
      
      const hasRealConnection = printerService.isConnected && 
                               printerService.selectedPrinter?.connected && 
                               printerService.selectedPrinter?.type !== 'browser';

      if (hasRealConnection) {
        console.log("📤 Disconnecting current printer...");
        setIsConnectingToPrinter(true);
        await printerService.disconnectPrinter();
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
        toast.success(`✅ ${result.message}`);
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

  // Automatic printing function
  const handleAutoPrint = async (order) => {
    try {
      // Safety check for printer service
      if (!printerService || typeof printerService.printBill !== 'function') {
        console.error('❌ Printer service not available');
        toast.warning("Bill saved but printing service unavailable");
        return false;
      }

      // Check printer connection
      const hasRealConnection = printerService.isConnected && 
                               printerService.selectedPrinter?.connected && 
                               printerService.selectedPrinter?.type !== 'browser';
      
      if (!hasRealConnection) {
        toast.warning("Please connect a printer first");
        return false;
      }

      // Calculate totals
      const items = order.items || [];
      const subtotal = order.total || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      const taxPercentage = order.taxPercentage || 0;
      const taxAmount = (subtotal * taxPercentage) / 100;
      const grandTotal = subtotal + taxAmount;

      // Prepare bill data for printing
      const printBillData = {
        hotelName: hotelInfo?.name || 'Restaurant',
        hotelAddress: hotelInfo?.address || '',
        hotelContact: hotelInfo?.contact || '',
        billNumber: `BL-${order.id || Date.now().toString().slice(-6)}`,
        date: new Date(order.createdat || Date.now()).toLocaleDateString('en-IN'),
        time: new Date(order.createdat || Date.now()).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        customername: order.customername || 'Walk-in Customer',
        tableNumber: order.tableNumber || 
                     (order.diningType === 'takeaway' ? 'Takeaway' : 
                      order.diningType === 'dine-in' ? (order.tableNumber || 'N/A') : 'N/A'),
        items: items.map(item => ({
          name: (item.name || 'Item').substring(0, 25),
          quantity: item.quantity || 1,
          price: `₹${(item.price || 0).toFixed(2)}`,
          total: `₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
        })),
        subtotal: `₹${subtotal.toFixed(2)}`,
        tax: `₹${taxAmount.toFixed(2)}`,
        taxRate: `${taxPercentage}%`,
        grandTotal: `₹${grandTotal.toFixed(2)}`,
        paymentMethod: (order.paymentType || 'CASH').toUpperCase(),
        staffName: order.staff?.name || 'Staff',
        orderType: order.diningType || 'Dine-in',
        phoneNumber: order.phoneNumber || 'N/A'
      };

      console.log('🖨️ Attempting to print bill...', printBillData);

      // Use the main printBill method
      const printResult = await printerService.printBill(printBillData);
      console.log('✅ Print result:', printResult);
      
      return printResult.success;
      
    } catch (printError) {
      console.error("Auto-print failed:", printError);
      return false;
    }
  };

  // Manual print function for existing orders
  const handlePrintOrder = async (order) => {
    try {
      setIsConnectingToPrinter(true);
      setPrinterStatus('Preparing to print...');
      
      const printSuccess = await handleAutoPrint(order);
      
      if (printSuccess) {
        setPrinterStatus(`Printed order #${order.id}`);
      } else {
        setPrinterStatus("Printing failed");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Error printing bill");
      setPrinterStatus("Print error");
    } finally {
      setIsConnectingToPrinter(false);
    }
  };

  const handleConfirm = (order) => {
    try {
      console.log('💳 Processing payment for order:', order.id);
      handleConfirmPayment(order);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment processing failed');
    } 
  };

  const handleConfirmPayment = async (order) => {
    console.log('💳 Confirming payment for order ID:', order.id);
    
    // Calculate totals
    const items = order.items || [];
    const subtotal = order.total || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const taxPercentage = order.taxPercentage || 0;
    const taxAmount = (subtotal * taxPercentage) / 100;
    const grandTotal = subtotal + taxAmount;
    
    const payload = {
      hotelId: order.hotelId || hotelId,
      staffId: order.staff?.id || localStorage.getItem("staffId") || "1",
      customername: order.customername || 'Walk-in Customer',
      phoneNumber: order.phoneNumber || '',
      total: subtotal,
      finalTotal: grandTotal,
      paymentType: order.paymentType || 'cash',
      items: items.map(item => ({
        productId: item.productId || item.id, 
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price || 0
      })),
      taxPercentage,
      taxAmount,
      tableNumber: order.diningType === 'dine-in' ? (order.tableNumber || null) : null,
      diningType: order.diningType || null,
      carDetails: order.diningType === 'takeaway' ? (order.carDetails || null) : null,
    };

    console.log('📤 Submitting bill with payload', payload);
    
    try {
      // Submit bill to backend
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/bill/create`, payload);
      
      console.log('✅ Bill created:', response.data);
      console.log('🖨️ Attempting to print bill for order ID:', order.id);
      
      // Call the automatic print function
      const printSuccess = await handleAutoPrint({
        ...order,
        id: response.data.id || order.id,
        createdat: new Date().toISOString(),
        total: subtotal,
        finalTotal: grandTotal,
        taxPercentage: taxPercentage,
        taxAmount: taxAmount
      });
      
      if (printSuccess) {
        toast.success('Bill submitted and printed successfully!', { 
          position: "top-center", 
          autoClose: 3000 
        });
      } else {
        toast.success('Bill submitted successfully! Printing skipped or failed.', { 
          position: "top-center", 
          autoClose: 3000 
        });
      }

      // Refresh orders list after successful billing
      setTimeout(() => {
        fetchOrders();
      }, 1000);

    } catch (error) {
      console.error('Error submitting bill:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit bill';
      toast.error(`Error: ${errorMsg}`, { 
        position: "top-center",
        autoClose: 3000 
      });
    }
  };

  const fetchOrders = async () => {
    if (!hotelId) {
      console.log('❌ No hotelId provided');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching orders for hotel:', hotelId);
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/bill/orders/${hotelId}`;
      console.log('📡 API URL:', url);
      
      const res = await axios.get(url);
      
      console.log('✅ Full response:', res);
      console.log('📦 Response data:', res.data);
      
      let ordersData = [];
      
      if (res.data && res.data.success) {
        ordersData = res.data.data || [];
        console.log('📊 Orders from new format:', ordersData.length);
      } else if (Array.isArray(res.data)) {
        ordersData = res.data;
        console.log('📊 Orders from old format:', ordersData.length);
      } else {
        console.error('❌ Unexpected response format:', res.data);
        throw new Error('Unexpected response format from server');
      }

      const processedOrders = ordersData.map(order => {
        if (order.items && typeof order.items === 'string') {
          try {
            order.items = JSON.parse(order.items);
          } catch (parseError) {
            console.error('❌ Error parsing items:', parseError);
            order.items = [];
          }
        }
        
        if (!Array.isArray(order.items)) {
          order.items = [];
        }
        
        return order;
      });

      console.log('✅ Processed orders:', processedOrders.length);
      setOrders(processedOrders);
      
    } catch (err) {
      console.error("❌ Error fetching orders", err);
      console.error("❌ Error details:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to load orders';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      console.log('🎯 HotelId changed:', hotelId);
      fetchOrders();
      fetchHotelInfo();
      
      // Check printer status
      const interval = setInterval(checkPrinterStatus, 3000);
      checkPrinterStatus();
      
      return () => clearInterval(interval);
    }
  }, [hotelId]);

  // Filter orders based on selected date and search term
  useEffect(() => {
    console.log('🔄 Filtering orders, total orders:', orders.length);
    let filtered = orders;

    // Date filtering
    if (selectedDate) {
      const selectedDateStr = new Date(selectedDate).toISOString().slice(0, 10);
      console.log('📅 Filtering by date:', selectedDateStr);
      
      filtered = filtered.filter(order => {
        if (!order.createdat) {
          console.warn('⚠️ Order missing createdat:', order);
          return false;
        }
        const orderDate = new Date(order.createdat).toISOString().slice(0, 10);
        return orderDate === selectedDateStr;
      });
      
      console.log('📊 After date filtering:', filtered.length, 'orders');
    }

    // Search filtering
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        // Search in customer name
        if (order.customername?.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search in phone number
        if (order.phoneNumber?.includes(searchTerm)) {
          return true;
        }
        // Search in staff name
        if (order.staff?.name?.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search in items
        if (order.items && Array.isArray(order.items)) {
          const hasMatchingItem = order.items.some(item => 
            item.name?.toLowerCase().includes(searchLower)
          );
          if (hasMatchingItem) return true;
        }
        // Search in payment type
        if (order.paymentType?.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search in order ID
        if (order.id?.toString().includes(searchTerm)) {
          return true;
        }
        return false;
      });
      console.log('🔍 After search filtering:', filtered.length, 'orders');
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, selectedDate, searchTerm]);

  const loadRecycleBin = () => {
    try {
      const savedRecycleBin = localStorage.getItem(`hotel_${hotelId}_recycle_bin`);
      if (savedRecycleBin) {
        const recycleBinData = JSON.parse(savedRecycleBin);
        // Filter out items older than 7 days when loading
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const filteredRecycleBin = recycleBinData.filter(item => 
          new Date(item.deletedAt).getTime() > sevenDaysAgo
        );
        
        // Update localStorage with filtered data
        if (filteredRecycleBin.length !== recycleBinData.length) {
          localStorage.setItem(`hotel_${hotelId}_recycle_bin`, JSON.stringify(filteredRecycleBin));
        }
        
        setRecycleBin(filteredRecycleBin);
      }
    } catch (error) {
      console.error('Error loading recycle bin:', error);
    }
  };

  const deleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to move this bill to recycle bin? It will be automatically deleted after 7 days.')) {
      return;
    }

    setDeleteLoading(billId);
    
    try {
      console.log('🗑️ Moving bill to recycle bin:', billId);
      
      // Find the bill in local state
      const billToDelete = orders.find(order => order.id === billId);
      
      if (!billToDelete) {
        throw new Error('Bill not found in local state');
      }
      
      // Create recycle bin object with additional metadata
      const recycleBinObject = {
        ...billToDelete,
        deletedAt: new Date().toISOString(),
        deletedBy: 'user',
        originalDeletionDate: billToDelete.createdat,
        restoreId: billId,
        isDeleted: true,
        deletionTimestamp: Date.now(),
        autoDeleteDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString() // 7 days from now
      }; 
      
      console.log('📦 Creating recycle bin object:', recycleBinObject);

      try {
        // Get existing recycle bin from localStorage
        const existingRecycleBin = JSON.parse(localStorage.getItem(`hotel_${hotelId}_recycle_bin`) || '[]');
        
        // Add new deleted bill
        existingRecycleBin.push(recycleBinObject);
        
        // Save back to localStorage (limit to last 100 deleted items)
        const limitedRecycleBin = existingRecycleBin.slice(-100);
        localStorage.setItem(`hotel_${hotelId}_recycle_bin`, JSON.stringify(limitedRecycleBin));
        
        // Update state for immediate UI feedback
        setRecycleBin(limitedRecycleBin);
        
        console.log('💾 Saved to local recycle bin. Total items:', limitedRecycleBin.length);
      } catch (storageError) {
        console.error('❌ Local storage error:', storageError);
      }
      
      const billTimestamp = billToDelete.createdat;
      const customerName = billToDelete.customername;
      const phoneNumber = billToDelete.phoneNumber;
      
      if (!billTimestamp) {
        throw new Error('Cannot delete: Bill timestamp not found');
      }
      
      console.log('📅 Using bill data for matching:', {
        timestamp: billTimestamp,
        customerName,
        phoneNumber,
        hotelId
      });
      
      // Step 1: Try to delete orders by timestamp (if endpoint exists)
      try {
        const deleteOrdersUrl = `${import.meta.env.VITE_BACKEND_URL}/api/orders/delete-by-timestamp`;
        await axios.delete(deleteOrdersUrl, {
          data: {
            timestamp: billTimestamp,
            hotelId: hotelId,
            customerName: customerName,
            phoneNumber: phoneNumber
          }
        });
        console.log('✅ Orders deletion attempted');
      } catch (ordersError) {
        console.log('⚠️ Orders deletion endpoint not available or failed:', ordersError.message);
        // Continue with bill deletion even if orders deletion fails
      }
      
      // Step 2: Delete the bill
      const deleteBillUrl = `${import.meta.env.VITE_BACKEND_URL}/api/bill/delete/${billId}`;
      const response = await axios.delete(deleteBillUrl);

      if (response.data.success) {
        // Remove the bill from local state
        setOrders(prevOrders => prevOrders.filter(order => order.id !== billId));
        
        // Show success message
        toast.success(
          <div>
            ✅ Bill moved to recycle bin! 
            <span className="ml-2 text-sm text-gray-600">
              (Auto-deletes in 7 days)
            </span>
          </div>,
          {
            position: "top-center",
            autoClose: 5000,
            icon: "🗑️"
          }
        );
      } else {
        throw new Error(response.data.error || 'Failed to delete bill');
      }
      
    } catch (error) {
      console.error('❌ Error deleting bill:', error);
      
      // More specific error handling
      if (error.message.includes('not found')) {
        toast.error('❌ Bill not found');
      } else if (error.response?.status === 404) {
        toast.error('❌ Delete failed: API endpoint not found');
      } else {
        toast.error(`❌ Failed to delete bill: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  // Function to export recycle bin to Excel
  const exportRecycleBinToExcel = () => {
    if (recycleBin.length === 0) {
      alert('No items to export');
      return;
    }
    
    const excelData = recycleBin.map(item => {
      const deletedDate = new Date(item.deletedAt);
      const autoDeleteDate = new Date(deletedDate.getTime() + (7 * 24 * 60 * 60 * 1000));
      const daysLeft = Math.ceil((autoDeleteDate - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        'Bill ID': item.restoreId,
        'Customer Name': item.customername || 'N/A',
        'Phone Number': item.phoneNumber || 'N/A',
        'Total Amount': item.total || 0,
        'Payment Type': item.paymentType || 'cash',
        'Staff Name': item.staff?.name || 'Unknown',
        'Items Count': item.items?.length || 0,
        'Deleted Date': deletedDate.toLocaleString(),
        'Auto Delete Date': autoDeleteDate.toLocaleDateString(),
        'Days Remaining': daysLeft > 0 ? daysLeft : 0
      };
    });
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Deleted Bills');
    XLSX.writeFile(workbook, `recycle_bin_${hotelId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success('Recycle bin exported to Excel');
  };

  const isOrderFromSelectedDate = (order) => {
    if (!selectedDate) return false;
    const selectedDateStr = new Date(selectedDate).toISOString().slice(0, 10);
    const orderDate = new Date(order.createdat).toISOString().slice(0, 10);
    return orderDate === selectedDateStr;
  };

  // Export to Excel functionality
  const exportToExcel = async () => {
    if (!hotelId) {
      alert('Please select a hotel first');
      return;
    }

    if (!exportStartDate || !exportEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    // Validate date range (max 5 years)
    const start = new Date(exportStartDate);
    const end = new Date(exportEndDate);
    const maxDateRange = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
    
    if (end - start > maxDateRange) {
      alert('Date range cannot exceed 5 years');
      return;
    }

    if (start > end) {
      alert('Start date cannot be after end date');
      return;
    }

    setExportLoading(true);
    
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/bill/export-orders/${hotelId}`;
      const params = {
        startDate: exportStartDate,
        endDate: exportEndDate,
        exportType: exportType
      };

      console.log('📤 Exporting orders with params:', params);

      const response = await axios.get(url, {
        params: params,
        responseType: 'blob' // Important for file download
      });

      if (exportType === 'download') {
        // Create download link
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Extract filename from response headers or generate one
        const contentDisposition = response.headers['content-disposition'];
        let filename = `hotel_${hotelId}_orders_${exportStartDate}_to_${exportEndDate}.xlsx`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch) filename = filenameMatch[1];
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        alert(`✅ Excel file downloaded successfully!\nDate Range: ${exportStartDate} to ${exportEndDate}\nTotal Orders: ${filteredOrders.length}`);
      } else {
        // Handle S3 upload response
        const result = JSON.parse(await response.data.text());
        if (result.success) {
          alert(`✅ File uploaded to S3 successfully!\nURL: ${result.url}`);
        } else {
          alert(`ℹ️ ${result.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Export error:', error);
      
      let errorMessage = 'Failed to export orders';
      if (error.response?.status === 400) {
        errorMessage = error.response.data.error || 'Invalid export parameters';
      } else if (error.response?.status === 404) {
        errorMessage = 'No orders found for the specified date range';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(`❌ Export failed: ${errorMessage}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Client-side export of current filtered view
  const exportCurrentViewToExcel = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export');
      return;
    }

    // Prepare data for Excel
    const excelData = filteredOrders.map(order => {
      const itemsText = order.items && order.items.length > 0 
        ? order.items.map(item => 
            `${item.name || 'Unknown Item'} (Qty: ${item.quantity || 0}, Price: ₹${item.price || 0})`
          ).join('; ')
        : 'No items';

      return {
        'Order ID': order.id,
        'Customer Name': order.customername || 'N/A',
        'Phone Number': order.phoneNumber || 'N/A',
        'Items': itemsText,
        'Total Amount (₹)': order.total || 0,
        'Payment Type': order.paymentType || 'cash',
        'Staff Name': order.staff?.name || 'Unknown Staff',
        'Table Number': order.tableNumber || 'N/A',
        'Dining Type': order.diningType || 'N/A',
        'Car Details': order.carDetails || 'N/A',
        'Order Date': order.createdat ? new Date(order.createdat).toLocaleString() : 'N/A'
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    // Generate filename and download
    const filename = `hotel_${hotelId}_current_view_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    alert(`✅ Exported ${filteredOrders.length} orders to Excel!`);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const showPagination = filteredOrders.length > itemsPerPage;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.querySelector(".orders-container")?.scrollIntoView({ behavior: "smooth" });
  };

  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPages = 5;

    let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let end = Math.min(totalPages, start + maxPages - 1);

    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) pageNumbers.push(i);

    return (
      <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of{" "}
          {filteredOrders.length} orders
          {searchTerm && (
            <span className="ml-2 text-blue-600">
              (filtered by: "{searchTerm}")
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Previous */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          {/* First page + dots */}
          {start > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 rounded text-sm font-medium bg-white border hover:bg-gray-50"
              >
                1
              </button>
              {start > 2 && <span className="text-gray-500">...</span>}
            </>
          )}

          {/* Page numbers */}
          {pageNumbers.map(n => (
            <button
              key={n}
              onClick={() => handlePageChange(n)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentPage === n
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-700 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          ))}

          {/* Last page + dots */}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="text-gray-500">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1 rounded text-sm font-medium bg-white border hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Toggle Switch Component (similar to DailyReport)
  const renderToggleSwitch = () => (
    <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm border">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">{showRecycleBin ? '🗑️' : '📋'}</span>
          {showRecycleBin ? 'Recycle Bin View' : 'Active Orders View'}
        </h3>
        <p className="text-sm text-gray-600">
          {showRecycleBin 
            ? 'View deleted bills (Auto-deletes in 7 days)' 
            : 'View active orders list'}
        </p>
      </div>
      
      <button
        onClick={() => setShowRecycleBin(!showRecycleBin)}
        className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all duration-300 transform hover:scale-105"
      >
        <FontAwesomeIcon icon={faExchangeAlt} className="w-4 h-4" />
        <span className="text-sm font-medium">
          Switch to {showRecycleBin ? 'Active Orders' : 'Recycle Bin'}
        </span>
      </button>
    </div>
  );

  // Recycle Bin View (when toggled ON)
  const renderRecycleBinView = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">🗑️</span> Recycle Bin
            <span className="ml-3 bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
              {recycleBin.length} items
            </span>
          </h2>
          <p className="text-gray-600 mt-1">
            Deleted bills are automatically removed after 7 days
          </p>
        </div>
        
        <button
          onClick={exportRecycleBinToExcel}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">📊</span>
          Export to Excel
        </button>
      </div>

      {recycleBin.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4 text-gray-300">📭</div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No deleted bills</h3>
          <p className="text-gray-400">Deleted bills will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto min-w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-3 text-left">Bill ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Staff</th>
                <th className="px-4 py-3 text-left">Deleted On</th>
                <th className="px-4 py-3 text-left">Auto Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recycleBin.map((item, index) => {
                const deletedDate = new Date(item.deletedAt);
                const autoDeleteDate = new Date(deletedDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                const daysLeft = Math.ceil((autoDeleteDate - new Date()) / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">#{item.restoreId}</td>
                    <td className="px-4 py-3 font-medium">{item.customername || "Customer"}</td>
                    <td className="px-4 py-3 font-semibold">₹{(item.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.paymentType === 'cash' 
                          ? 'bg-green-100 text-green-800'
                          : item.paymentType === 'card'
                          ? 'bg-blue-100 text-blue-800'
                          : item.paymentType === 'upi'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {(item.paymentType || 'cash').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {item.staff?.name || "Staff"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {deletedDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        daysLeft <= 1 ? 'bg-red-100 text-red-800' :
                        daysLeft <= 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {daysLeft > 0 ? `${daysLeft} days` : 'Today'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {recycleBin.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {recycleBin.length} deleted bills
        </div>
      )}
    </div>
  );

  // Active Orders View (when toggled OFF)
  const renderActiveOrdersView = () => (
    <>
      {/* Orders Table */}
      {!loading && !error && filteredOrders.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-full">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Total (₹)</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Staff Name</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {currentOrders.map((order, index) => (
                  <tr
                    key={order.id || index}
                    className={`transition-all duration-150 ${
                      isOrderFromSelectedDate(order)
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-sm">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3">
                      {/* Customer Name */}
                      <div className="font-medium text-gray-900">
                        {order.customername || "N/A"}
                      </div>

                      {/* Order Type Badge */}
                      <div className="text-xs mt-1">
                        {(order.diningType && order.diningType.toLowerCase() === 'takeaway') ? (
                          <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Takeaway
                          </span>
                        )
                          : (order.tableNumber && order.tableNumber !== 'null' && order.tableNumber !== 'N/A' && order.tableNumber !== '') ? (
                            <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Table {order.tableNumber}
                            </span>
                          )
                            : (
                              <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Dine-in
                              </span>
                            )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">{order.phoneNumber || "N/A"}</td>

                    <td className="px-4 py-3">
                      <ul className="list-disc list-inside text-sm">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <li key={idx} className="mb-1 last:mb-0">
                              {item.name || 'Unknown Item'} × {item.quantity || 0}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No items</li>
                        )}
                      </ul>
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      ₹{(order.total || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.paymentType === 'cash' 
                          ? 'bg-green-100 text-green-800'
                          : order.paymentType === 'card'
                          ? 'bg-blue-100 text-blue-800'
                          : order.paymentType === 'upi'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {(order.paymentType || 'cash').toUpperCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {order.staff?.name || "Unknown Staff"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {order.createdat ? new Date(order.createdat).toLocaleString('en-IN') : 'N/A'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        {/* Print Button */}
                        <button
                          onClick={() => handlePrintOrder(order)}
                          disabled={isConnectingToPrinter}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center transition-colors"
                          title="Print this bill"
                        >
                          {isConnectingToPrinter ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <span className="mr-2">🖨️</span>
                              Print
                            </>
                          )}
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => deleteBill(order.id)}
                          disabled={deleteLoading === order.id}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center justify-center transition-colors"
                          title="Move to recycle bin (Auto-deletes in 7 days)"
                        >
                          {deleteLoading === order.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <span className="mr-2">🗑️</span>
                              Move to Recycle Bin
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {renderPagination()}
        </>
      )}
    </>
  );

  // Add printer connection section in your UI
  const renderPrinterSection = () => (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🖨️</span> Printer Status
      </h3>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600">
            Status: <span className={`font-medium ${
              printerStatus.includes("Connected") ? "text-green-600" : "text-red-600"
            }`}>
              {printerStatus}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {printerStatus.includes("Connected") 
              ? "✅ Ready for automatic printing" 
              : "⚠️ Connect a printer for automatic bill printing"}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleConnectPrinter}
            disabled={isConnectingToPrinter}
            className={`px-4 py-2 rounded-md flex items-center justify-center ${
              printerStatus.includes("Connected")
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {isConnectingToPrinter ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : printerStatus.includes("Connected") ? (
              <>
                <span className="mr-2">🔌</span>
                Disconnect
              </>
            ) : (
              <>
                <span className="mr-2">🔗</span>
                Connect Printer
              </>
            )}
          </button>
          
          <button
            onClick={checkPrinterStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md orders-container">
      {/* Header with Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">📦</span> Orders for Hotel #{hotelId}
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders by customer, phone, items, staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-2 z-10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 font-medium">
                    {showRecycleBin ? recycleBin.length : filteredOrders.length} results found
                  </span>
                  <button
                    onClick={clearSearch}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Info */}
          <div className="flex items-center space-x-4">
            {loading && (
              <span className="text-blue-600 text-sm flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Loading...
              </span>
            )}
            {error && (
              <span className="text-red-600 text-sm flex items-center">
                <span className="mr-1">❌</span> Error: {error}
              </span>
            )}
            {!loading && !error && (
              <span className="text-green-600 text-sm flex items-center">
                <span className="mr-1">✅</span>
                {showRecycleBin ? `${recycleBin.length} deleted bills` : `${filteredOrders.length} orders`}
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add Printer Section Here */}
      {renderPrinterSection()}

      {/* Toggle Switch */}
      {renderToggleSwitch()}

      {/* Export Section */}
      {!showRecycleBin && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="mr-2">📊</span> Export Orders to Excel
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Date Range Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                max={exportEndDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={exportStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Export Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export To
              </label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="download">📥 Download to Device</option>
                <option value="s3">☁️ Upload to S3</option>
              </select>
            </div>

            {/* Export Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={exportToExcel}
                disabled={exportLoading || !hotelId}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📊</span>
                    Export Date Range
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Date Range Info */}
          <div className="mt-2 text-sm text-gray-600">
            <p className="flex items-center">
              <span className="mr-1">💡</span>
              Maximum date range: 5 years. Current range: {
              exportStartDate && exportEndDate 
                ? `${Math.ceil((new Date(exportEndDate) - new Date(exportStartDate)) / (1000 * 60 * 60 * 24))} days`
                : 'Not selected'
            }</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {showRecycleBin ? 'recycle bin' : 'orders'}...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold flex items-center">
            <span className="mr-2">❌</span>
            Error loading {showRecycleBin ? 'recycle bin' : 'orders'}
          </p>
          <p className="mt-1">{error}</p>
          <button
            onClick={showRecycleBin ? loadRecycleBin : fetchOrders}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center"
          >
            <span className="mr-2">🔄</span>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && showRecycleBin && recycleBin.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">
            {searchTerm 
              ? `No deleted bills found for "${searchTerm}"`
              : 'No deleted bills found'
            }
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Deleted bills are automatically removed after 7 days
          </p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {!loading && !error && !showRecycleBin && filteredOrders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">
            {searchTerm 
              ? `No orders found for "${searchTerm}"`
              : 'No orders found'
            }
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {selectedDate 
              ? `for ${new Date(selectedDate).toLocaleDateString()}` 
              : 'for this hotel'
            }
          </p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Main Content Based on Toggle */}
      {showRecycleBin ? renderRecycleBinView() : renderActiveOrdersView()}
    </div>
  );
};

export default HotelOrdersList;