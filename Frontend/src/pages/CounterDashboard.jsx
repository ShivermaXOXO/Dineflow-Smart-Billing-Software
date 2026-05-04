import React, { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosConfig';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import socket from '../services/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import {
  faUser,
  faReceipt,
  faShoppingCart,
  faMoneyBillWave,
  faClock,
  faStore,
  faChartLine,
  faTimes,
  faTable,
  faCheckCircle,
  faClipboardCheck,
  faPhone,
  faCar,
  faPrint,
  faPlus,
  faUtensils,
  faShoppingBag,
  faEye, // Add this
  faInfoCircle // Add this
} from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import printerService from '../services/printerService';
import SettleBillModal from '../components/counter/SettleBillModal';
import DirectBillModal from '../components/counter/DirectBillModal';
import ProductList from '../components/staff/ProductList';
import OrderForm from '../components/staff/OrderForm';
import NewOrderDialog from '../components/staff/NewOrderDialog';
import { getArrayFromStorage } from "../utils/storage";

// Define these components OUTSIDE of the main StaffDashboard component
const CompletedOrdersTab = ({ orders, onViewDetails, onPrintReceipt }) => {
  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Completed Orders
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Total: {orders.length} orders
        </p>
      </div>

      <div className="p-6">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faClipboardCheck} className="text-gray-400 text-4xl mb-3" />
            <p className="text-gray-500">No completed orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber || `ORD-${order.id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customername || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {/* Check if dining type is takeaway OR tableNumber is empty */}
                      {order.diningType === 'takeaway'
                        ? 'Takeaway'
                        : order.tableNumber || 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      ₹{order.finalTotal || order.totalAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt || order.createdat).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const TakeawayOrdersTab = ({
  onSettleTakeawayBill,
  pendingTakeawayOrders,
  onRefresh,
  onViewDetails,
  onSetTakeaway,
  onAddMore
}) => {
  // Get pending orders count from localStorage
  const [pendingCount, setPendingCount] = useState(0);

  // Function to get pending orders count from localStorage
  const getPendingOrdersCount = () => {
    const takeawayOrders = getArrayFromStorage("savedTakeawayOrders");

    return takeawayOrders.filter(order =>
      order?.status === "pending" ||
      order?.status === undefined ||
      !order?.status
    ).length;
  };


  // Update count on component mount and when orders change
  useEffect(() => {
    const count = getPendingOrdersCount();
    setPendingCount(count);
  }, [pendingTakeawayOrders]);

  // Refresh count function
  const refreshCount = () => {
    const count = getPendingOrdersCount();
    setPendingCount(count);
    if (onRefresh) onRefresh();
  };
  // Use only pending orders from parent
  const allTakeawayOrders = [...pendingTakeawayOrders];

  // Function to calculate total amount safely
  const calculateTotalAmount = (order) => {
    try {
      // Try to get total from different possible fields
      if (order.totalAmount !== undefined && order.totalAmount !== null) {
        return parseFloat(order.totalAmount) || 0;
      }
      if (order.total !== undefined && order.total !== null) {
        return parseFloat(order.total) || 0;
      }
      if (order.finalTotal !== undefined && order.finalTotal !== null) {
        return parseFloat(order.finalTotal) || 0;
      }

      // Calculate from items
      if (order.items && Array.isArray(order.items)) {
        return order.items.reduce((sum, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseInt(item.quantity) || 0;
          return sum + (price * quantity);
        }, 0);
      }

      // Calculate from kots
      if (order.kots && Array.isArray(order.kots)) {
        return order.kots.reduce((kotSum, kot) => {
          if (kot.items && Array.isArray(kot.items)) {
            return kotSum + kot.items.reduce((itemSum, item) => {
              const price = parseFloat(item.price) || 0;
              const quantity = parseInt(item.quantity) || 0;
              return itemSum + (price * quantity);
            }, 0);
          }
          return kotSum;
        }, 0);
      }

      return 0;
    } catch (error) {
      console.error('Error calculating total amount:', error);
      return 0;
    }
  };

  // Function to handle settling takeaway bill
  const handleSettleClick = async (order) => {
    console.log('Settle button clicked for order:', order);

    // Call the parent handler to process the settlement
    if (onSettleTakeawayBill) {
      onSettleTakeawayBill(order);
    }
  };

  // Function to format date safely
  const formatOrderTime = (order) => {
    try {
      if (order.createdAt) {
        return new Date(order.createdAt).toLocaleString();
      }
      if (order.createdat) {
        return new Date(order.createdat).toLocaleString();
      }
      if (order.date) {
        return new Date(order.date).toLocaleString();
      }
      if (order.timestamp) {
        return new Date(order.timestamp).toLocaleString();
      }
      return 'Just now';
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Function to get items safely
  const getOrderItems = (order) => {
    const items = [];

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item, idx) => {
        items.push({
          key: `item-${idx}`,
          name: item.name || 'Unnamed Item',
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 0,
          total: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
        });
      });
    }

    return items;
  };

  // Function to clear all pending orders
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all pending takeaway orders? This action cannot be undone.')) {
      localStorage.removeItem('savedTakeawayOrders');
      if (onRefresh) onRefresh(); // Call parent refresh function
      toast.success('All pending takeaway orders cleared');
    }
  };

  // Function to delete single order
  const handleDeleteOrder = (order) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const storedOrders = JSON.parse(localStorage.getItem('savedTakeawayOrders') || '[]');
      const updatedOrders = storedOrders.filter(storedOrder =>
        storedOrder.orderId !== (order.orderId || order.id)
      );
      localStorage.setItem('savedTakeawayOrders', JSON.stringify(updatedOrders));
      if (onRefresh) onRefresh();
      toast.success('Order deleted successfully');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Takeaway Orders
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Total: {pendingCount} pending orders
          </p>
        </div>
        <button
          onClick={() => onSetTakeaway && onSetTakeaway()}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center w-full sm:w-auto justify-center"
        >
          <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
          Takeaway Order
        </button>
      </div>

      <div className="p-6">
        {allTakeawayOrders.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faShoppingBag} className="text-gray-300 text-5xl mb-4" />
            <p className="text-gray-500 text-lg font-medium">No pending takeaway orders</p>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTakeawayOrders.map((order, index) => {
              const orderId = order.orderId || order.id || `TAKE-${Date.now()}-${index}`;
              const orderTime = formatOrderTime(order);
              const totalAmount = calculateTotalAmount(order);
              const orderItems = getOrderItems(order);

              return (
                <div key={orderId} className="border border-yellow-300 rounded-lg p-4 hover:shadow-lg transition-shadow bg-yellow-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {order.customername || order.customerName || 'Walk-in Customer'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        ID: {orderId.substring(0, 12)}...
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-medium">
                        ⏳ PENDING
                      </span>
                    </div>
                  </div>


                  {/* Order Items */}
                  <div className="mb-4 border-t border-yellow-200 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <button
                        onClick={() => onViewDetails && onViewDetails(order)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                        title="View complete order details"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-yellow-200 pt-4">
                    <div className="flex gap-3">
                      {/* Settle Bill Button */}
                      <button
                        onClick={() => handleSettleClick(order)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                      >
                        <FontAwesomeIcon icon={faUtensils} className="mr-2 text-lg" />
                        SETTLE BILL
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => onAddMore(order)}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add More Items
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
const TableWiseOrders = ({
  savedOrders = [],
  totalTableNumber,
  onSettleBill,
  onOpenNewOrderDialog // New prop to trigger opening of NewOrderDialog
}) => {
  const [openTable, setOpenTable] = useState(null);
  const [modalItems, setModalItems] = useState([]);
  const [showTableActions, setShowTableActions] = useState(null); // Track which table's actions to show

  const getTableWiseKOTs = (orders) => {
    const tableMap = {};

    orders.forEach(order => {
      order.kots.forEach(kot => {
        const tableNo = Number(kot.tableNumber);

        if (!tableMap[tableNo]) {
          tableMap[tableNo] = [];
        }

        tableMap[tableNo].push({
          ...kot,
          orderId: order.orderId,
          orderStatus: order.status
        });
      });
    });

    return tableMap;
  };

  const mergeTableItems = (tableKOTs, tableNo) => {
    const merged = {};

    tableKOTs.forEach(kot => {
      kot.items.forEach(item => {
        if (merged[item.name]) {
          merged[item.name].quantity += item.quantity;
        } else {
          merged[item.name] = {
            ...item,
            tableNumber: tableNo
          };
        }
      });
    });

    return Object.values(merged);
  };

  const openModal = (tableNo, items) => {
    setOpenTable(tableNo);
    setModalItems(items);
  };

  const closeModal = () => {
    setOpenTable(null);
    setModalItems([]);
  };

  // Function to handle table click for viewing existing orders
  const handleTableClick = (tableNo, hasOrders) => {
    if (hasOrders) {
      const tableWiseKOTs = getTableWiseKOTs(savedOrders);
      const tableKOTs = tableWiseKOTs[tableNo] || [];
      const mergedItems = mergeTableItems(tableKOTs, tableNo);
      openModal(tableNo, mergedItems);
    }
  };

  // Function to handle New Order button click
  const handleNewOrderClick = (tableNo, e) => {
    e.stopPropagation(); // Prevent table click event
    if (onOpenNewOrderDialog) {
      onOpenNewOrderDialog(tableNo);
    }
  };

  // Function to show/hide table action buttons
  const toggleTableActions = (tableNo, e) => {
    e.stopPropagation();
    setShowTableActions(showTableActions === tableNo ? null : tableNo);
  };

  return (
    <>
      {/* TABLE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: totalTableNumber }, (_, i) => {
          const tableNo = i + 1;
          const tableWiseKOTs = getTableWiseKOTs(savedOrders);
          const tableKOTs = tableWiseKOTs[tableNo] || [];
          const mergedItems = mergeTableItems(tableKOTs, tableNo);
          const hasOrders = mergedItems.length > 0;

          return (
            <div
              key={tableNo}
              className={`border rounded-lg p-4 shadow-md transition cursor-pointer relative
                ${hasOrders
                  ? "bg-green-50 border-green-400 hover:bg-green-100"
                  : "bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-300"
                }`}
              onClick={() => handleTableClick(tableNo, hasOrders)}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Table {tableNo}</h2>
                {hasOrders ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {mergedItems.length} items
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    Available
                  </span>
                )}
              </div>

              {!hasOrders ? (
                <div className="text-center py-3">
                  <FontAwesomeIcon icon={faUtensils} className="text-gray-400 text-2xl mb-2" />
                  <p className="text-sm text-gray-500">Click to start new order</p>
                  {/* New Order Button for empty tables */}
                  <button
                    onClick={(e) => handleNewOrderClick(tableNo, e)}
                    className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center w-full"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    New Order
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-3">
                    {mergedItems.length} item(s) pending
                  </p>

                  {/* Action Buttons for tables with orders */}
                  <div className="space-y-2">
                    {/* Main Action Buttons (always visible) */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(tableNo, mergedItems);
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
                      >
                        View Orders
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSettleBill(mergedItems, tableNo);
                        }}
                        className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700"
                      >
                        Settle Bill
                      </button>
                    </div>


                  </div>

                  {/* Quick New Order Button (alternative simpler version) */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={(e) => handleNewOrderClick(tableNo, e)}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add More Items
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL FOR EXISTING ORDERS */}
      {openTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Table {openTable} Orders
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-red-600 text-xl"
              >
                ✕
              </button>
            </div>

            {/* ORDER LIST */}
            <div className="max-h-64 overflow-y-auto border rounded-md p-3 bg-yellow-50">
              {modalItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm py-1"
                >
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>

            {/* MODAL ACTIONS - Added New Order Button */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (onOpenNewOrderDialog) {
                    onOpenNewOrderDialog(openTable);
                    closeModal();
                  }
                }}
                className="bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add New Order to This Table
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSettleBill(modalItems, openTable);
                    closeModal();
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700"
                >
                  Settle Bill
                </button>

                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded font-semibold hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
const TakeawayOrderDetailsModal = ({ order, isOpen, onClose, onSettle }) => {
  if (!isOpen || !order) return null;

  const items = order.items || [];
  const total = items.reduce((sum, item) =>
    sum + (item.price || 0) * (item.quantity || 1), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl z-10">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FontAwesomeIcon icon={faShoppingBag} className="mr-3 text-blue-600" />
            Takeaway Order Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-medium">{order.customername || 'Walk-in Customer'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">{order.phoneNumber || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Car Details</p>
                <p className="font-medium">{order.carDetails || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Order Time</p>
                <p className="font-medium">
                  {new Date(order.createdAt || order.createdat).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Order Items ({items.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        ₹{item.price?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-bold">
                      Grand Total:
                    </td>
                    <td className="px-4 py-3 font-bold text-lg text-green-700">
                      ₹{total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
            <button
              onClick={onSettle}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
            >
              <FontAwesomeIcon icon={faUtensils} className="mr-2" />
              Settle Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffDashboard = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('table-orders');
  const [completedOrders, setCompletedOrders] = useState([]);
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [pendingTakeawayOrders, setPendingTakeawayOrders] = useState([]);
  const [totalTableNumber, setTotalTableNumber] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [prefillOrderData, setPrefillOrderData] = useState(null);
  const [showTakeawayDetailsModal, setShowTakeawayDetailsModal] = useState(false);
  const [selectedTakeawayOrder, setSelectedTakeawayOrder] = useState(null);
  const [forceTakeawayMode, setForceTakeawayMode] = useState(false);
  // Function to handle viewing takeaway order details
  const handleViewTakeawayDetails = (order) => {
    setSelectedTakeawayOrder(order);
    setShowTakeawayDetailsModal(true);
  };
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount');

  const [orders, setOrders] = useState([]);
  const hotelId = localStorage.getItem("hotelId");

  const fetchOrders = async () => {
    if (hotelId == null) return
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/hotel/${hotelId}`
      );
      setOrders(res.data.filter(o => o.status !== "completed"));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [auth.hotelId]);

  useEffect(() => {
    socket.emit("joinHotelRoom", auth.hotelId);

    socket.on("orderUpdated", () => {
      fetchOrders();
      fetchCompletedOrders();
      loadPendingTakeawayOrders();
    });

    return () => {
      socket.off("orderUpdated");
    };
  }, []);

  useEffect(() => {
    const fetchTableNumber = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/hotels/${auth.hotelId}`
        );
        setTotalTableNumber(res.data.tablenumber);
        console.log("Fetched table number:", res.data.tablenumber);
      } catch (err) {
        console.error("Error fetching table number:", err);
      }
    };

    if (auth?.hotelId) {
      fetchTableNumber();
    }
  }, [auth?.hotelId]);

  useEffect(() => {

    if (!hotelId) return;

    const handler = ({ orders, kots, takeaway }) => {
      toast.success("Order created successfully");

      localStorage.setItem("savedOrders", orders);
      localStorage.setItem("savedKOTs", kots);
      localStorage.setItem("savedTakeawayOrders", takeaway);
      window.location.reload()
    };

    socket.on(`remoteOrder`, handler);

    return () => {
      socket.off(`remoteOrder`, handler);
    };
  }, []);


  // ================ CENTRALIZED LOCALSTORAGE FUNCTIONS ================

  // Function to get pending takeaway orders from localStorage
  const getPendingTakeawayOrders = () => {
    try {
      const stored = localStorage.getItem('savedTakeawayOrders');
      const parsed = stored ? JSON.parse(stored) : [];

      const orders = Array.isArray(parsed) ? parsed : [];

      return orders.filter(order =>
        order?.status === 'pending' ||
        order?.status === undefined ||
        !order?.status
      );
    } catch (error) {
      console.error('Error reading pending takeaway orders:', error);
      return [];
    }
  };
  //  New Handler for "Add More"
  const handleAddMoreToTakeaway = (order) => {
    console.log("Opening Add More for:", order.orderId);
    setForceTakeawayMode(true);

    setPrefillOrderData({
      customername: order.customername || '',
      phoneNumber: order.phoneNumber || '',
      carDetails: order.carDetails || '',
      diningType: 'takeaway',
      orderId: order.orderId
    });

    setShowNewOrderDialog(true);
  };
  // Function to save takeaway order to localStorage
  const saveTakeawayOrder = (order) => {
    try {
      const existingOrders = getPendingTakeawayOrders();
      const orderWithId = {
        ...order,
        orderId: order.orderId || `TAKE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: order.createdAt || new Date().toISOString(),
        status: 'pending'
      };

      // Check if order already exists
      const orderIndex = existingOrders.findIndex(o =>
        o.orderId === order.orderId ||
        (o.phoneNumber && order.phoneNumber && o.phoneNumber === order.phoneNumber &&
          new Date(o.createdAt).getTime() > Date.now() - 300000) // 5 minutes window
      );

      let updatedOrders = [...existingOrders];
      if (orderIndex > -1) {
        const oldOrder = existingOrders[orderIndex];
        console.log("Merging items into existing order:", oldOrder.orderId);

        const mergedItems = [...(oldOrder.items || []), ...(order.items || [])];
        const mergedKots = [...(oldOrder.kots || []), ...(order.kots || [])];
        const newTotal = mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        updatedOrders[orderIndex] = {
          ...oldOrder,
          items: mergedItems,
          kots: mergedKots,
          totalAmount: newTotal,
          updatedAt: new Date().toISOString()
        };

        toast.success("Items added to existing Takeaway Order!");
      } else {
        // Add new order

        updatedOrders.push(orderWithId);
        toast.success("New Takeaway Order Created!");
        updatedOrders = [...existingOrders, orderWithId];
      }

      localStorage.setItem('savedTakeawayOrders', JSON.stringify(updatedOrders));
      setPendingTakeawayOrders(updatedOrders);
      console.log('Takeaway order saved to localStorage:', orderWithId);
      const hotelId = localStorage.getItem("hotelId")
      const orders = localStorage.getItem("savedOrders")
      const kots = localStorage.getItem("savedKOTs")
      const takeaway = localStorage.getItem("savedTakeawayOrders")
      socket.emit("saveOrder", {
        hotelId,
        orders,
        kots,
        takeaway
      });
      return orderWithId;
    } catch (error) {
      console.error('Error saving takeaway order:', error);
      toast.error('Failed to save takeaway order');
      return null;
    }
  };

  useEffect(() => {
  const loadAllCountsOnPageLoad = async () => {
    console.log("Loading all counts on page load...");

    // 1. Completed orders count
    await fetchCompletedOrders();

    // 2. Takeaway orders count
    await fetchTakeawayOrders();
    loadPendingTakeawayOrders();

    // 3. Table orders count (SAFE)
    const tableStored = localStorage.getItem('savedOrders');
    const tableParsed = tableStored ? JSON.parse(tableStored) : [];
    const tableOrders = Array.isArray(tableParsed) ? tableParsed : [];

    console.log("Table orders count on load:", tableOrders.length);

    // 4. KOTs count (SAFE)
    const kotStored = localStorage.getItem('savedKOTs');
    const kotParsed = kotStored ? JSON.parse(kotStored) : [];
    const savedKOTs = Array.isArray(kotParsed) ? kotParsed : [];

    console.log(
      "Pending KOTs count on load:",
      savedKOTs.filter(k => !k?.orderCreated).length
    );

    // Force update
    setRefreshKey(prev => prev + 1);
  };

  if (auth?.hotelId) {
    loadAllCountsOnPageLoad();
  }
}, [auth?.hotelId]);

  const getLocalStorageCounts = () => {
  const counts = {
    takeawayOrders: 0,
    tableOrders: 0,
    completedOrders: Array.isArray(completedOrders) ? completedOrders.length : 0,
    pendingKOTs: 0
  };

  try {
    // Takeaway orders count
    const takeawayStored = localStorage.getItem('savedTakeawayOrders');
    const takeawayOrders = takeawayStored ? JSON.parse(takeawayStored) : [];

    if (Array.isArray(takeawayOrders)) {
      counts.takeawayOrders = takeawayOrders.filter(order =>
        order?.status === 'pending' || !order?.status
      ).length;
    }

    // Table orders count
    const tableStored = localStorage.getItem('savedOrders');
    const tableOrders = tableStored ? JSON.parse(tableStored) : [];

    if (Array.isArray(tableOrders)) {
      counts.tableOrders = tableOrders.length;
    }

    // Pending KOTs count
    const kotStored = localStorage.getItem('savedKOTs');
    const kots = kotStored ? JSON.parse(kotStored) : [];

    if (Array.isArray(kots)) {
      counts.pendingKOTs = kots.filter(k => !k?.orderCreated).length;
    }

  } catch (error) {
    console.error("Error getting localStorage counts:", error);
  }

  return counts;
};


  const localStorageCounts = getLocalStorageCounts();
  const removeTakeawayOrder = (orderId) => {
    try {
      const existingOrders = getPendingTakeawayOrders();
      const filteredOrders = existingOrders.filter(order => order.orderId !== orderId);
      localStorage.setItem('savedTakeawayOrders', JSON.stringify(filteredOrders));
      setPendingTakeawayOrders(filteredOrders);
      console.log('Takeaway order removed from localStorage:', orderId);
      return true;
    } catch (error) {
      console.error('Error removing takeaway order:', error);
      return false;
    }
  };

  // Function to clear all pending takeaway orders
  const clearAllPendingTakeawayOrders = () => {
    try {
      localStorage.removeItem('savedTakeawayOrders');
      setPendingTakeawayOrders([]);
      toast.success('All pending takeaway orders cleared');
      return true;
    } catch (error) {
      console.error('Error clearing all orders:', error);
      toast.error('Failed to clear orders');
      return false;
    }
  };

  // Function to load pending takeaway orders
  const loadPendingTakeawayOrders = () => {
    const orders = getPendingTakeawayOrders();
    setPendingTakeawayOrders(orders);
    console.log('Loaded pending takeaway orders from localStorage:', orders.length);
    return orders;
  };

  const [selectedTableForDialog, setSelectedTableForDialog] = useState(null);

  // Function to handle opening NewOrderDialog for a specific table
  const handleOpenNewOrderDialogForTable = (tableNo) => {
    console.log(`Opening NewOrderDialog for Table ${tableNo}`);
    setSelectedTableForDialog(tableNo);
    setShowNewOrderDialog(true);
  };

  // Function to handle Takeaway button click
// Update the existing handleSetTakeaway function:
const handleSetTakeaway = () => {
  console.log('Takeaway mode activated');
  setForceTakeawayMode(true);
  setShowNewOrderDialog(true);
  
  // Reset any table selection
  setSelectedTableForDialog(null);
  setPrefillOrderData(null);
};
// Add this function in StaffDashboard, before the return statement
const handleDeleteKot = (kotId) => {
  // 1️⃣ Remove from savedKOTs
  setSavedKOTs(prev => {
    const updatedKOTs = prev.filter(kot => kot.kotId !== kotId);
    localStorage.setItem("savedKOTs", JSON.stringify(updatedKOTs));
    return updatedKOTs;
  });

  // 2️⃣ Remove from savedOrders → inside kots array
  setSavedOrders(prev => {
    const updatedOrders = prev
      .map(order => ({
        ...order,
        kots: order.kots.filter(kot => kot.kotId !== kotId),
      }))
      // ❗ Optional: remove empty orders (no KOTs left)
      .filter(order => order.kots.length > 0);

    localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
    return updatedOrders;
  });

  toast.success("KOT deleted successfully");
};

  // Function to fetch completed orders
  const fetchCompletedOrders = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/hotel/${hotelId}`
      );

      setCompletedOrders(
        response.data.filter(order => order.status === "completed")
      );
    } catch (error) {
      console.error("Error fetching completed orders:", error);
      setCompletedOrders([]);
    }
  };

  // Function to fetch takeaway orders from API
  const fetchTakeawayOrders = async () => {
    try {
      // Fetch completed takeaway orders from API
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/hotel/${auth.hotelId}`
      );

      // Filter for completed takeaway orders
      const apiTakeawayOrders = response.data.filter(order =>
        order.diningType === 'takeaway' && order.status === 'completed'
      );

      console.log('Fetched completed takeaway orders from API:', apiTakeawayOrders.length);
      setTakeawayOrders(apiTakeawayOrders);
    } catch (error) {
      console.error('Error fetching takeaway orders:', error);
      toast.error('Failed to load takeaway orders');
    }
  };

  // Add to your useEffect to fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'completed') {
      fetchCompletedOrders();
    } else if (activeTab === 'takeaway') {
      fetchTakeawayOrders();
      loadPendingTakeawayOrders(); // Load pending orders when tab changes
    }
  }, [activeTab, refreshKey]);

  // Load pending orders on component mount
  useEffect(() => {
    loadPendingTakeawayOrders();
  }, []);

  // Debug mode check - only log in development
  const isDebugMode = import.meta.env.DEV;
  const debugLog = (...args) => {
    if (isDebugMode) {
      console.log(...args);
    }
  };

  const [savedKOTs, setSavedKOTs] = useState(() => {
    const stored = localStorage.getItem('savedKOTs');
    return stored ? JSON.parse(stored) : [];
  });

  const [savedOrders, setSavedOrders] = useState(() => {
    try {
    const stored = localStorage.getItem('savedOrders');
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [finalTotal, setFinalTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [billItems, setBillItems] = useState([]);
  const [mobileNumber, setMobileNumber] = useState('');
  const [customername, setcustomername] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [todayStats, setTodayStats] = useState({
    myOrders: 0,
    myRevenue: 0,
    currentShiftOrders: 0,
    avgOrderValue: 0
  });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrderInfo, setCurrentOrderInfo] = useState(null);

  // Additional state for order management
  const [showMenuSection, setShowMenuSection] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [ordercustomername, setOrdercustomername] = useState('');
  const [orderMobileNumber, setOrderMobileNumber] = useState('');
  const [orderDiningType, setOrderDiningType] = useState('');
  const [orderTableNumber, setOrderTableNumber] = useState('');
  const [orderCarDetails, setOrderCarDetails] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [hotelInfo, setHotelInfo] = useState({});

  // Bill panel visibility state
  const [showBillPanel, setShowBillPanel] = useState(false);

  // New order dialog state
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);

  // Add a force update counter for form reset
  const [formResetCounter, setFormResetCounter] = useState(0);

  // New state for tax and table number
  const [tableNumber, setTableNumber] = useState('');
  const [addTax, setAddTax] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState('');

  // New state for dining type and car details
  const [diningType, setDiningType] = useState('');
  const [carDetails, setCarDetails] = useState('');

  // Ref for scrolling to menu section
  const menuSectionRef = useRef(null);

  // State for logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const [printerStatus, setPrinterStatus] = useState("Printer not connected");
  const [isConnectingToPrinter, setIsConnectingToPrinter] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [showPrinterList, setShowPrinterList] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);

  const handleKOTSave = (kot) => {
    setSavedKOTs(prev => {
      const updated = [...prev, kot];
      localStorage.setItem('savedKOTs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCheckout = () => {
    console.log('===================Checkout initiated with items:', billItems);
    if (billItems.length === 0) {
      toast.warning("Please add items to the bill");
      return;
    }
    setShowModal(true);
  };

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
        toast.warning("Please connect a printer first", { position: "top-center", autoClose: 1000 });
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

  const handleReconnectPrinter = async () => {
    console.log("🔁 Manual reconnection requested");
    await handleConnectPrinter();
  };

  const onPrintKOT = (tableNo = null, isTakeaway = false) => {
    console.log("Printing KOTs for table:", tableNo, "isTakeaway:", isTakeaway);

    // Filter pending KOTs
    let pendingKOTs = savedKOTs.filter(k => k.status === "pending");

    // If it's takeaway, filter only takeaway KOTs
    if (isTakeaway) {
      pendingKOTs = pendingKOTs.filter(kot =>
        kot.diningType === 'takeaway' ||
        (!kot.tableNumber && kot.diningType !== 'dine-in')
      );

      if (pendingKOTs.length === 0) {
        toast.info("No pending takeaway KOTs");
        return;
      }

      console.log(`Found ${pendingKOTs.length} takeaway KOTs`);
    }
    // If table number is provided, filter for that specific table
    else if (tableNo !== null && tableNo !== "") {
      pendingKOTs = pendingKOTs.filter(kot =>
        kot.tableNumber == tableNo || kot.tableNumber === tableNo
      );

      if (pendingKOTs.length === 0) {
        toast.info(`No pending KOTs for Table ${tableNo}`);
        return;
      }

      console.log(`Found ${pendingKOTs.length} KOTs for Table ${tableNo}`);
    } else {
      // No table number - print all pending KOTs
      if (pendingKOTs.length === 0) {
        toast.info("No pending KOTs");
        return;
      }
    }

    // Print each KOT
    pendingKOTs.forEach(kot => {
      printSingleKOT(kot);
    });

    // Show success message
    if (isTakeaway) {
      toast.success(`Printed ${pendingKOTs.length} takeaway KOT(s)`, { position: "top-center", autoClose: 1000 });
    } else if (tableNo) {
      toast.success(`Printed ${pendingKOTs.length} KOT(s) for Table ${tableNo}`, { position: "top-center", autoClose: 1000 });
    } else {
      toast.success(`Printed ${pendingKOTs.length} KOT(s)`);
    }
  };

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

  const printSingleKOT = async (kot) => {
    if (!kot?.items || !Array.isArray(kot.items)) return;

    const kotHTML = `
      <html>
        <body style="font-family: monospace; font-size:12px">
          <h3 style="text-align:center">KOT</h3>
          <p>${kot.diningType?.toUpperCase()}</p>
          ${kot.tableNumber ? `<p>Table ${kot.tableNumber}</p>` : ""}
          <hr/>
          ${kot.items.map(i => `<div>${i.name} x ${i.quantity}</div>`).join("")}
        </body>
      </html>
    `;

    try {
      const printSuccess = await handleAutoPrint(kot);

      if (printSuccess) {
        setPrinterStatus(`Printed order #${kot.id}`);
      } else {
        setPrinterStatus("Printing failed");
      }
    } catch (error) {
      console.error("Print error:", error);
      setPrinterStatus("Print error");
    } finally {
      setIsConnectingToPrinter(false);
    }

    // Update status to completed immediately after printing

  };

  const handlePrintBill = async (orderData = null, tableNumber = null, diningType = null, staffId = null) => {
    try {
      // Filter KOTs based on current context (table or takeaway)
      const filteredKOTs = savedKOTs.filter(kot => {
        if (forceTakeawayMode || orderData.diningType === 'takeaway') {
          // For takeaway, show only takeaway KOTs
          return kot.diningType === 'takeaway';
        }

        if (orderData.tableNumber || initialTableNumber) {
          // For dine-in, show only that table's KOTs
          const tableNo = orderData.tableNumber || initialTableNumber;
          return kot.tableNumber == tableNo;
        }

        // If no specific context, show all KOTs
        return true;
      });

      if (filteredKOTs.length === 0) {
        const context = forceTakeawayMode || orderData.diningType === 'takeaway'
          ? 'takeaway order'
          : orderData.tableNumber || initialTableNumber
            ? `Table ${orderData.tableNumber || initialTableNumber}`
            : 'order';

        toast.error(`No items to bill for this ${context}`);
        return;
      }

      // Calculate merged items
      const mergedItems = {};
      filteredKOTs.forEach(kot => {
        kot.items.forEach(item => {
          if (mergedItems[item.productId]) {
            mergedItems[item.productId].quantity += item.quantity;
          } else {
            mergedItems[item.productId] = {
              name: item.name,
              quantity: item.quantity,
              price: item.price || 0,
              productId: item.productId
            };
          }
        });
      });

      const billItems = Object.values(mergedItems);
      const subtotal = billItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Create order object for printing
      const printOrder = {
        id: Date.now().toString().slice(-6),
        createdat: new Date().toISOString(),
        customername: orderData.customername || 'Walk-in Customer',
        phoneNumber: orderData.phoneNumber || '',
        tableNumber: orderData.tableNumber || initialTableNumber || '',
        diningType: forceTakeawayMode ? 'takeaway' : (orderData.diningType || 'dine-in'),
        items: billItems.map(item => ({
          productId: item.productId,
          name: item.name,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: subtotal,
        taxPercentage: 0, // You can adjust this based on your settings
        paymentType: 'CASH', // Default payment type
        carDetails: orderData.carDetails || '',
        notes: orderData.notes || '',
        staff: {
          name: staffId || 'Counter Staff' // Adjust based on your staff data
        }
      };

      // Check if handleAutoPrint is available (from counter dashboard)
      if (typeof handleAutoPrint === 'function') {
        console.log('🖨️ Using handleAutoPrint for direct printing...');

        const printSuccess = await handleAutoPrint(printOrder);

        if (printSuccess) {
          const context = forceTakeawayMode || orderData.diningType === 'takeaway'
            ? 'Takeaway'
            : orderData.tableNumber || initialTableNumber
              ? `Table ${orderData.tableNumber || initialTableNumber}`
              : 'Order';

          toast.success(`Bill printed for ${context} - Total: ₹${subtotal.toFixed(2)}`);
          return;
        } else {
          // Fallback to browser print if handleAutoPrint fails
          toast.warning("Using browser print as fallback");
        }
      }

      // Fallback: Use browser print (original implementation)
      console.log('🖨️ Using browser print fallback...');

      const generateBillHTML = () => {
        return `
        <html>
          <head>
            <title>Final Bill</title>
            <style>
              @media print {
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  margin: 0;
                  padding: 10px;
                  width: 80mm;
                }
                * {
                  box-sizing: border-box;
                }
              }
              @media screen {
                body {
                  font-family: Arial, sans-serif;
                  font-size: 14px;
                  padding: 20px;
                  background: #f5f5f5;
                }
                .print-preview {
                  width: 80mm;
                  margin: 0 auto;
                  background: white;
                  padding: 15px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  border: 1px solid #ddd;
                }
              }
              .receipt {
                width: 100%;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 2px dashed #000;
              }
              .restaurant-name {
                font-size: 16px;
                font-weight: bold;
                margin: 5px 0;
              }
              .address {
                font-size: 10px;
                color: #666;
                margin: 3px 0;
              }
              .bill-title {
                font-size: 14px;
                font-weight: bold;
                margin: 8px 0;
                text-align: center;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
                font-size: 11px;
              }
              .info-label {
                font-weight: bold;
                min-width: 70px;
              }
              .separator {
                border-top: 1px dashed #000;
                margin: 8px 0;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 11px;
              }
              .items-table th {
                text-align: left;
                padding: 4px 2px;
                border-bottom: 1px dashed #000;
                font-weight: bold;
              }
              .items-table td {
                padding: 4px 2px;
                border-bottom: 1px dotted #ddd;
              }
              .item-name {
                width: 60%;
              }
              .item-qty {
                width: 10%;
                text-align: center;
              }
              .item-price {
                width: 15%;
                text-align: right;
              }
              .item-total {
                width: 15%;
                text-align: right;
              }
              .total-section {
                margin-top: 15px;
                padding-top: 8px;
                border-top: 2px dashed #000;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 12px;
              }
              .grand-total {
                font-weight: bold;
                font-size: 14px;
                margin-top: 8px;
              }
              .footer {
                text-align: center;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px dashed #000;
                font-size: 10px;
                color: #666;
              }
              .thank-you {
                font-style: italic;
                margin: 10px 0;
                font-size: 11px;
              }
              .kot-info {
                font-size: 10px;
                color: #888;
                margin: 2px 0;
              }
              .kot-id {
                background: #f0f0f0;
                padding: 2px 5px;
                border-radius: 3px;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="${typeof window !== 'undefined' && window.innerWidth > 768 ? 'print-preview' : ''}">
              <div class="receipt">
                <!-- Header -->
                <div class="header">
                  <div class="restaurant-name">YOUR RESTAURANT NAME</div>
                  <div class="address">Restaurant Address Line 1</div>
                  <div class="address">City, State - PIN Code</div>
                  <div class="address">Phone: +91 XXXXX XXXXX</div>
                  <div class="address">GSTIN: XXXXXXX</div>
                </div>
                
                <!-- Bill Title -->
                <div class="bill-title">FINAL BILL</div>
                
                <!-- Customer & Order Info -->
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span>${new Date().toLocaleTimeString()}</span>
                </div>
                
                ${orderData.tableNumber ? `
                  <div class="info-row">
                    <span class="info-label">Table:</span>
                    <span>${orderData.tableNumber}</span>
                  </div>
                ` : ''}
                
                ${orderData.diningType === 'takeaway' ? `
                  <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span>Takeaway</span>
                  </div>
                ` : ''}
                
                ${orderData.customername && orderData.customername !== 'Walk-in Customer' ? `
                  <div class="info-row">
                    <span class="info-label">Customer:</span>
                    <span>${orderData.customername}</span>
                  </div>
                ` : ''}
                
                ${orderData.phoneNumber ? `
                  <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span>${orderData.phoneNumber}</span>
                  </div>
                ` : ''}
                
                ${orderData.carDetails && orderData.diningType === 'takeaway' ? `
                  <div class="info-row">
                    <span class="info-label">Vehicle:</span>
                    <span>${orderData.carDetails}</span>
                  </div>
                ` : ''}
                
                ${orderData.notes ? `
                  <div class="info-row">
                    <span class="info-label">Notes:</span>
                    <span>${orderData.notes}</span>
                  </div>
                ` : ''}
                
                <div class="separator"></div>
                
                <!-- KOT Information -->
                <div class="kot-info">
                  <div>Included KOTs:</div>
                  ${filteredKOTs.map(kot => `
                    <div>• <span class="kot-id">${kot.kotId}</span> - ${new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  `).join('')}
                </div>
                
                <div class="separator"></div>
                
                <!-- Items Table -->
                <table class="items-table">
                  <thead>
                    <tr>
                      <th class="item-name">Item</th>
                      <th class="item-qty">Qty</th>
                      <th class="item-price">Price</th>
                      <th class="item-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${billItems.map(item => `
                      <tr>
                        <td class="item-name">${item.name}</td>
                        <td class="item-qty">${item.quantity}</td>
                        <td class="item-price">₹${item.price.toFixed(2)}</td>
                        <td class="item-total">₹${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div class="separator"></div>
                
                <!-- Totals -->
                <div class="total-section">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                  </div>
                  <div class="total-row">
                    <span>GST (0%):</span>
                    <span>₹0.00</span>
                  </div>
                  <div class="total-row grand-total">
                    <span>GRAND TOTAL:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="separator"></div>
                
                <!-- Footer -->
                <div class="footer">
                  <div class="thank-you">Thank you for dining with us!</div>
                  <div>Please visit again</div>
                  <div>Generated by Restaurant POS System</div>
                  <div>Bill ID: BILL-${Date.now().toString().slice(-6)}</div>
                </div>
              </div>
            </div>
            
            <script>
              // Auto-print and close
              window.onload = function() {
                // Print immediately
                window.print();
                
                // Close window after printing (for popup)
                setTimeout(function() {
                  window.close();
                }, 1000);
              };
              
              // Handle print dialog cancellation
              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;
      };


    
    // Show success message
    const context = forceTakeawayMode || orderData.diningType === 'takeaway' 
      ? 'Takeaway' 
      : orderData.tableNumber || initialTableNumber 
        ? `Table ${orderData.tableNumber || initialTableNumber}` 
        : 'Order';
    
    toast.success(`Bill printed for ${context} - Total: ₹${subtotal.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error printing bill:', error);
  }
};

  // const handleDeleteKOT = (kotId) => {
  //   setSavedKOTs(prev => {
  //     const updated = prev.filter(kot => kot.kotId !== kotId);
  //     localStorage.setItem('savedKOTs', JSON.stringify(updated)); // update storage
  //     return updated;
  //   });
  // };

  const orderCreatedKOTs = savedKOTs.filter(
    kot => kot.orderCreated === true
  );

  const handleCreateOrder = (tableNo = null, isTakeaway = false, existingOrderId = null) => {
  console.log("Creating order from saved KOTs:", savedKOTs);
  console.log("Filtering - Table:", tableNo, "isTakeaway:", isTakeaway);

  const unusedKOTs = savedKOTs.filter(kot => !kot.orderCreated);

    if (unusedKOTs.length === 0) {
      toast.error("No new KOTs to create order");
      return;
    }

    // Filter KOTs based on criteria
    let filteredKOTs = unusedKOTs;

    if (isTakeaway) {
      // For takeaway orders - only takeaway KOTs
      filteredKOTs = unusedKOTs.filter(kot =>
        kot.diningType === 'takeaway' ||
        (!kot.tableNumber && kot.diningType !== 'dine-in')
      );

      if (filteredKOTs.length === 0) {
        toast.error('No takeaway KOTs found');
        return;
      }

      console.log("Takeaway KOTs found:", filteredKOTs.length);
    }
    else if (tableNo !== null) {
      // For dine-in orders with specific table
      filteredKOTs = unusedKOTs.filter(kot =>
        kot.tableNumber == tableNo &&
        kot.diningType !== 'takeaway'
      );

      if (filteredKOTs.length === 0) {
        toast.error(`No KOTs found for Table ${tableNo}`);
        return;
      }
    }

    // Separate KOTs by type
    const takeawayKOTs = filteredKOTs.filter(kot =>
      kot.tableNumber === null || kot.tableNumber === '' || kot.diningType === 'takeaway'
    );

    const dineInKOTs = filteredKOTs.filter(kot =>
      kot.tableNumber && kot.tableNumber !== '' && kot.diningType !== 'takeaway'
    );

  console.log("Takeaway KOTs:", takeawayKOTs.length);
  console.log("Dine-in KOTs:", dineInKOTs.length);

    let ordersCreated = 0;

    // Create takeaway order if there are takeaway KOTs
    if (takeawayKOTs.length > 0) {
      const takeawayOrderId = existingOrderId || `TAKE-${Date.now()}`;

      const takeawayOrder = {
        orderId: takeawayOrderId,
        createdAt: new Date().toISOString(),
        status: "pending",
        diningType: 'takeaway',
        name: takeawayKOTs[0]?.customername || takeawayKOTs[0]?.name || 'Walk-in Customer',
        customername: takeawayKOTs[0]?.customername || 'Walk-in Customer',
        phoneNumber: takeawayKOTs[0]?.phoneNumber || '',
        carDetails: takeawayKOTs[0]?.carDetails || '',
        items: takeawayKOTs.flatMap(kot =>
          kot.items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        ),
        totalAmount: takeawayKOTs.reduce((total, kot) => {
          return total + kot.items.reduce((kotTotal, item) =>
            kotTotal + (item.price * item.quantity), 0);
        }, 0),
        kots: takeawayKOTs
      };

      saveTakeawayOrder(takeawayOrder);

      // Mark takeaway KOTs as used
      setSavedKOTs(prev =>
        prev.map(k =>
          takeawayKOTs.find(t => t.kotId === k.kotId)
            ? { ...k, orderCreated: true }
            : k
        )
      );

      ordersCreated++;
      toast.success(`Takeaway order created successfully! (${takeawayKOTs.length} KOTs)`, { position: "top-center", autoClose: 1000 });
    }

    // Create dine-in orders (grouped by table number)
    const dineInByTable = {};
    dineInKOTs.forEach(kot => {
      const tableNo = kot.tableNumber;
      if (!dineInByTable[tableNo]) {
        dineInByTable[tableNo] = [];
      }
      dineInByTable[tableNo].push(kot);
    });

  Object.entries(dineInByTable).forEach(([tableNumber, tableKOTs]) => {
    if (tableKOTs.length > 0) {
      const dineInOrderId = `DINE-${Date.now()}-${tableNumber}`;
      
      // const dineInOrder = {
      //   orderId: dineInOrderId,
      //   createdAt: new Date().toISOString(),
      //   status: "pending",
      //   tableNumber: tableNumber,
      //   diningType: 'dine-in',
      //   customername: tableKOTs[0]?.customername || 'Walk-in Customer',
      //   phoneNumber: tableKOTs[0]?.phoneNumber || '',
      //   kots: tableKOTs.map(kot => ({
      //     ...kot,
      //     orderCreated: true
      //   })),
      // };

      // Save dine-in order
      setSavedOrders(prev => {
        const orders = [...prev];

        // 1️⃣ Find existing pending dine-in order for the table
        const existingOrderIndex = orders.findIndex(
          order =>
            order.diningType === "dine-in" &&
            order.tableNumber === tableNumber &&
            order.status === "pending"
        );

        if (existingOrderIndex !== -1) {
          // 2️⃣ Table order exists → append ONLY new KOTs

          // 🔒 Prevent duplicate KOTs
          const existingKotIds = new Set(
            orders[existingOrderIndex].kots.map(k => k.kotId)
          );

          const newKots = tableKOTs
            .filter(kot => !existingKotIds.has(kot.kotId))
            .map(kot => ({
              ...kot,
              orderCreated: true,
            }));

          orders[existingOrderIndex].kots.push(...newKots);

          // Optional: update timestamp
          orders[existingOrderIndex].updatedAt = new Date().toISOString();

        } else {
      // 3️⃣ No order exists → create new dine-in order
          const dineInOrder = {
            orderId: dineInOrderId,
            createdAt: new Date().toISOString(),
            status: "pending",
      tableNumber,
      diningType: "dine-in",
      customername: tableKOTs[0]?.customername || "Walk-in Customer",
      phoneNumber: tableKOTs[0]?.phoneNumber || "",
      kots: tableKOTs.map(kot => ({
        ...kot,
        orderCreated: true,
      })),
    };

          orders.push(dineInOrder);
        }

        localStorage.setItem("savedOrders", JSON.stringify(orders));
        return orders;
      });

      // Mark dine-in KOTs as used
      setSavedKOTs(prev =>
        prev.map(k =>
          tableKOTs.find(d => d.kotId === k.kotId)
            ? { ...k, orderCreated: true }
            : k
        )
      );

      ordersCreated++;
    }
  });

    if (ordersCreated === 0) {
      toast.error("No valid KOTs to create orders");
      return;
    }

    setShowNewOrderDialog(false);

    // Automatically switch to appropriate tab
    if (takeawayKOTs.length > 0) {
      setActiveTab('takeaway');
    } else if (dineInKOTs.length > 0) {
      setActiveTab('table-orders');
    }

    // Summary message
    const summary = [];
    if (takeawayKOTs.length > 0) {
      summary.push(`${takeawayKOTs.length} takeaway KOT(s)`);
    }
    if (dineInKOTs.length > 0) {
      const tableCount = Object.keys(dineInByTable).length;
      summary.push(`${dineInKOTs.length} dine-in KOT(s) for ${tableCount} table(s)`);
    }

    toast.info(`Created ${ordersCreated} order(s) from: ${summary.join(', ')}`);
    const hotelId = localStorage.getItem("hotelId")
    const orders = localStorage.getItem("savedOrders")
    const kots = localStorage.getItem("savedKOTs")
    const takeaway = localStorage.getItem("savedTakeawayOrders")
    socket.emit("saveOrder", {
      hotelId,
      orders,
      kots,
      takeaway
    });
  };
  const getTableWiseKOTs = (savedOrders) => {
    const tableMap = {};

    savedOrders.forEach(order => {
      order.kots.forEach(kot => {
        const tableNo = Number(kot.tableNumber);

        if (!tableMap[tableNo]) {
          tableMap[tableNo] = [];
        }

        tableMap[tableNo].push({
          ...kot,
          orderId: order.orderId,
          orderStatus: order.status
        });
      });
    });

    return tableMap;
  };

  const mergeTableItems = (tableKOTs, tableNo) => {
    const merged = {};

    tableKOTs.forEach(kot => {
      kot.items.forEach(item => {
        if (merged[item.name]) {
          merged[item.name].quantity += item.quantity;
        } else {
          merged[item.name] = {
            ...item,
            tableNumber: tableNo // Add table number to each item
          };
        }
      });
    });

    return Object.values(merged);
  };

  // Function to handle new takeaway order from NewOrderDialog
  const handleTakeawayOrderCreated = (takeawayOrder) => {
    // console.log('New takeaway order received:', takeawayOrder);
    const savedOrder = saveTakeawayOrder(takeawayOrder);
    if (savedOrder) {
      toast.success('Takeaway order saved!');
      setRefreshKey(prev => prev + 1);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const adminId = parseInt(
        localStorage.getItem("staffId") || localStorage.getItem("userId") || "1"
      );
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/admin-stats/${parseInt(
          auth.hotelId
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
      // console.error("Error fetching admin stats:", error);
      setTodayStats({
        myOrders: 0,
        myRevenue: 0,
        currentShiftOrders: 0,
        avgOrderValue: 0,
      });
    }
  };

  // Handle settlement of takeaway bill
  const handleSettleTakeawayBill = (takeawayOrder) => {
    // console.log('Settling takeaway bill:', takeawayOrder);

    // ✅ IMPORTANT: Save the takeaway order ID
    const takeawayOrderId = takeawayOrder.orderId || takeawayOrder.id;
    setCurrentOrderId(takeawayOrderId);
    // console.log('Set currentOrderId for takeaway:', takeawayOrderId);

    // Convert takeaway order items to bill items format
    const billItemsForBilling = [];

    // Handle items from different structures
    if (takeawayOrder.items) {
      takeawayOrder.items.forEach((item, index) => {
        billItemsForBilling.push({
          id: `${item.productId}_${index}_${Date.now()}`,
          productId: item.productId,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          hotelId: auth.hotelId,
          tableNumber: null,
        });
      });
    } else if (takeawayOrder.kots) {
      takeawayOrder.kots.forEach(kot => {
        if (kot.items) {
          kot.items.forEach((item, index) => {
            billItemsForBilling.push({
              id: `${item.productId}_${index}_${Date.now()}`,
              productId: item.productId,
              name: item.name,
              price: Number(item.price),
              quantity: item.quantity,
              hotelId: auth.hotelId,
              tableNumber: null,
            });
          });
        }
      });
    }

    // Set bill items
    setBillItems(billItemsForBilling);

    // Set customer details from takeaway order
    setcustomername(takeawayOrder.customername || 'Walk-in Customer');
    setMobileNumber(takeawayOrder.phoneNumber || '');
    setDiningType('takeaway');
    setCarDetails(takeawayOrder.carDetails || '');

    // Show bill panel
    setShowBillPanel(true);
    setActiveTab('table-orders'); // Switch to table orders tab to show bill panel

    // Scroll to bill panel
    setTimeout(() => {
      document.getElementById('bill-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    toast.info(`Takeaway order loaded for billing. Click "Confirm Payment" to complete.`, { position: "top-center", autoClose: 1000 });
  };

  const handlePayment = async (total) => {


    try {
      if (!paymentType) {
        toast.warning("Please select a payment method");
        return;
      }

      // console.log('Current table number state:', tableNumber);
      // console.log('Current dining type:', diningType);
      // console.log('===================Processing payment with items:', billItems);
      // console.log('Customer Name:', auth.hotelId);

      const billData = {
        customername: customername || "Walk-in Customer",
        phoneNumber: mobileNumber || "N/A",
        items: billItems.map((item) => ({
          productId: item.productId || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        paymentType,
        hotelId: parseInt(auth.hotelId),
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
        finalTotal: total,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/create`,
        billData
      );
      setDiscount(0)
      try {
        // ✅ FIX: Only update existing order if it's not a temporary takeaway ID
        if (currentOrderId && !currentOrderId.startsWith('TAKE-')) {
          // Order exists → just mark completed (only for real database IDs)
          await axios.put(
            `${import.meta.env.VITE_BACKEND_URL}/api/orders/${currentOrderId}/status`,
            {
              status: "completed",
              finalTotal: billData.finalTotal,
            }
          );
          console.log("Existing order marked as completed");

        } else {
          // ✅ Order does NOT exist or has temporary ID → create new completed order
          const orderData = {
            customername: billData.customername,
            phoneNumber: billData.phoneNumber,
            items: billData.items,
            total: billData.total,
            finalTotal: total,
            paymentType: billData.paymentType,
            hotelId: billData.hotelId,
            staffId: billData.staffId,
            tableNumber: billData.tableNumber,
            diningType: billData.diningType,
            carDetails: billData.carDetails,
            status: "completed", // 🔥 IMPORTANT
          };

          console.log("Creating new completed order with data:", orderData);
          await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/orders`,
            orderData
          );
          console.log("New completed order created");
          console.log("Order synced with bill successfully", orderData);
        }
      } catch (error) {
        console.error("Failed to sync order with bill:", error);
        // Don't block the main flow if order sync fails
        toast.warning("Bill created but order sync failed. Bill ID: " + (response.data?.id || "unknown"));
      }

      // ✅ CLEANUP FOR DINE-IN ORDERS
      if (diningType === 'dine-in' && tableNumber) {
        console.log("Cleaning up KOTs and orders for table:", tableNumber);
        // Get current table number from bill items
        const settledTableNumber = tableNumber ||
          (billItems.length > 0 ? billItems[0].tableNumber : null);

        if (settledTableNumber) {
          // 1. Remove KOTs for this table
          const updatedKOTs = savedKOTs.filter(kot => {
            // Keep KOTs that are NOT for this table OR not orderCreated
            return !(kot.tableNumber == settledTableNumber && kot.orderCreated);
          });

          // Update KOTs state and localStorage
          setSavedKOTs(updatedKOTs);
          localStorage.setItem("savedKOTs", JSON.stringify(updatedKOTs));
          console.log("Updated KOTs after removal:", updatedKOTs.length);

          // 2. Remove orders for this table
          const updatedOrders = savedOrders.filter(order => {
            // Check if any KOT in this order belongs to the settled table
            const hasKOTForThisTable = order.kots?.some(kot =>
              kot.tableNumber == settledTableNumber
            );
            return !hasKOTForThisTable; // Keep orders that DON'T have KOTs for this table
          });

          // Update orders state and localStorage
          setSavedOrders(updatedOrders);
          localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
          console.log("Updated orders after removal:", updatedOrders.length);

          // 3. Also remove from savedKOTs directly (as a fallback)
          const allSavedKOTs = JSON.parse(localStorage.getItem("savedKOTs") || "[]");
          const filteredKOTs = allSavedKOTs.filter(kot =>
            !(kot.tableNumber == settledTableNumber && kot.orderCreated)
          );
          localStorage.setItem("savedKOTs", JSON.stringify(filteredKOTs));

          // 4. Remove any pending orders from localStorage for this table
          const allSavedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]");
          const filteredOrders = allSavedOrders.filter(order => {
            const hasTableKOT = order.kots?.some(kot => kot.tableNumber == settledTableNumber);
            return !hasTableKOT;
          });
          localStorage.setItem("savedOrders", JSON.stringify(filteredOrders));

          console.log(`Cleaned up table ${settledTableNumber} from localStorage`);
        }
      }

      // ✅ CLEANUP FOR TAKEAWAY ORDERS
      if (diningType === 'takeaway') {
        console.log("Takeaway order settled, removing from localStorage");

        // Remove the settled order from localStorage
        if (currentOrderId) {
          removeTakeawayOrder(currentOrderId);
        }

      }

      toast.success("Bill created successfully!", { position: "top-center", autoClose: 1000 });

      // Auto-print the bill
      if (autoPrintEnabled) {
        await handleAutoPrint(billData);
      }

      // Reset form and close modal
      setShowModal(false);
      setBillItems([]);
      setMobileNumber("");
      setcustomername("");
      setPaymentType("");
      setTableNumber("");
      setAddTax(false);
      setTaxPercentage(0);
      setDiningType("");
      setCarDetails("");
      setCurrentOrderId(null);
      setCurrentOrderInfo(null);
      setShowBillPanel(false);


      // Refresh stats
      setTimeout(() => {
        fetchAdminStats();
      }, 500);
      setRefreshKey((prev) => prev + 1);

      // Emit socket event for real-time updates
      // socket.emit("billCreated", { hotelId: auth.hotelId, billData });
      const hotelId = localStorage.getItem("hotelId")
      const orders = localStorage.getItem("savedOrders")
      const kots = localStorage.getItem("savedKOTs")
      const takeaway = localStorage.getItem("savedTakeawayOrders")
      socket.emit("saveOrder", {
        hotelId,
        orders,
        kots,
        takeaway
      });

    } catch (error) {
      console.error("Error creating bill:", error);
      toast.error("Failed to create bill");
    }
  };
  // Add these missing functions
  const handleViewOrderDetails = (order) => {
    console.log('View order details:', order);
    // You can implement a modal or detailed view here
    toast.info(`Viewing order ${order.orderNumber || order.id}`);
  };

  const handlePrintTakeawayReceipt = async (order) => {
    try {
      if (printerService.isConnected) {
        const printResult = await printerService.printBill({
          ...order,
          billNumber: `REPRINT-${order.orderNumber || order.id}`,
          isReprint: true
        });

        if (printResult.success) {
          toast.success('Receipt reprinted successfully');
        } else {
          toast.error('Failed to reprint receipt');
        }
      } else {
        toast.warning('Please connect a printer first', { position: "top-center", autoClose: 1000 });
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    }
  };

  const handlePrintReceipt = async (order) => {
    try {
      if (printerService.isConnected) {
        const printResult = await printerService.printBill({
          ...order,
          billNumber: `REPRINT-${order.orderNumber || order.id}`,
          isReprint: true
        });

        if (printResult.success) {
          toast.success('Receipt reprinted successfully', { position: "top-center", autoClose: 1000 });
        } else {
          toast.error('Failed to reprint receipt', { position: "top-center", autoClose: 1000 });
        }
      } else {
        toast.warning('Please connect a printer first', { position: "top-center", autoClose: 1000 });
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    }
  };

  // Debug function to check localStorage (security-safe)
  const debugLocalStorage = () => {
    debugLog('=== LocalStorage Debug ===');
    debugLog('token:', localStorage.getItem('token') ? '[TOKEN_PRESENT]' : '[NO_TOKEN]');
    debugLog('userId:', localStorage.getItem('userId'));
    debugLog('hotelId:', localStorage.getItem('hotelId'));
    debugLog('role:', localStorage.getItem('role'));
    debugLog('name:', localStorage.getItem('name'));

    // Check all staffStats keys
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('staffStats_'));
    debugLog('All staffStats keys:', allKeys);
    allKeys.forEach(key => {
      debugLog(`${key}:`, localStorage.getItem(key));
    });
    debugLog('Auth context (token hidden):', {
      ...auth,
      token: auth.token ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'
    });
    debugLog('Current todayStats:', todayStats);
    debugLog('=== End Debug ===');
  };

  // Call debug on mount
  useEffect(() => {
    debugLocalStorage();
  }, []);

  // Make debug function available globally for testing
  useEffect(() => {
    window.debugStaffDashboard = {
      debugLocalStorage,
      saveTestStats: () => {
        const userId = localStorage.getItem('userId');
        const hotelId = localStorage.getItem('hotelId');
        if (userId && hotelId) {
          const testStats = {
            myOrders: 5,
            myRevenue: 1500,
            currentShiftOrders: 3,
            avgOrderValue: 500
          };
          const key = `staffStats_${userId}_${hotelId}`;
          localStorage.setItem(key, JSON.stringify(testStats));
          debugLog('Saved test stats');
          setTodayStats(testStats);
        }
      },
      clearStats: () => {
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('staffStats_'));
        allKeys.forEach(key => localStorage.removeItem(key));
        debugLog('Cleared all stats');
      }
    };
  }, []);

  // Initialize stats from localStorage on component mount
  useEffect(() => {
    // Try to load stats immediately when component mounts
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const hotelId = localStorage.getItem('hotelId');

    debugLog('Initial mount - localStorage values:', {
      token: token ? '[TOKEN_PRESENT]' : '[NO_TOKEN]',
      userId,
      hotelId
    });

    if (userId && hotelId && userId !== 'undefined' && hotelId !== 'undefined' && userId !== 'null' && hotelId !== 'null') {
      const currentKey = `staffStats_${userId}_${hotelId}`;
      const savedStats = localStorage.getItem(currentKey);

      debugLog('Looking for stats with key:', currentKey);
      debugLog('Found saved stats:', savedStats ? 'Yes' : 'No');

      if (savedStats) {
        try {
          const parsed = JSON.parse(savedStats);
          debugLog('Initial load: Loading saved stats from localStorage');
          setTodayStats(parsed);
        } catch (e) {
          debugLog('Failed to parse saved stats on initial load');
        }
      } else {
        debugLog('No saved stats found for current user');
      }
    } else {
      debugLog('Invalid auth data on initial load');
    }
  }, []); // Run only once on mount

  // Fetch staff's performance stats
  const fetchStaffStats = async () => {
    // Skip if we don't have valid auth data
    if (!auth?.userId || !auth?.hotelId || auth.userId === 'undefined' || auth.hotelId === 'undefined') {
      debugLog('Invalid auth data for stats fetch - userId and hotelId required');
      return;
    }

    try {
      debugLog('Fetching staff stats for user');

      // Fetch staff revenue data
      const staffRevenueResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/staff-revenue/${auth.hotelId}`
      );
      debugLog('Staff Revenue API Response count:', staffRevenueResponse.data?.length || 0);

      // Handle both string and number IDs for robust matching
      const authUserId = parseInt(auth.userId);

      // Find current staff's data with proper type conversion
      const myStats = staffRevenueResponse.data.find(staff => {
        const staffId = parseInt(staff.staffId);
        const matches = staffId === authUserId;
        return matches;
      }) || { orders: 0, revenue: 0 };

      debugLog('My Stats found - Orders:', myStats.orders, 'Revenue:', myStats.revenue);

      // Fetch today's orders for this staff (use customer orders endpoint for consistency)
      const ordersResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/hotel/${auth.hotelId}`
      );
      debugLog('Orders API Response count:', ordersResponse.data?.length || 0);

      const today = new Date().toISOString().slice(0, 10);

      // Filter for today's completed orders by this staff
      const todayCompletedOrders = ordersResponse.data.filter(order => {
        const orderStaffId = parseInt(order.staffId);
        const orderDate = new Date(order.createdat).toISOString().slice(0, 10);
        const staffMatches = orderStaffId === authUserId;
        const dateMatches = orderDate === today;
        const statusMatches = order.status === 'completed';

        return staffMatches && dateMatches && statusMatches;
      });

      debugLog('Today completed customer orders for current staff:', todayCompletedOrders.length);

      // Also get bills for revenue calculation
      const billsResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/orders/${auth.hotelId}`
      );

      const todayBills = billsResponse.data.filter(bill => {
        const billStaffId = parseInt(bill.staffId);
        const billDate = new Date(bill.createdat).toISOString().slice(0, 10);
        const staffMatches = billStaffId === authUserId;
        const dateMatches = billDate === today;

        return staffMatches && dateMatches;
      });

      const todayRevenue = todayBills.reduce((sum, bill) => {
        const billTotal = parseFloat(bill.total) || 0;
        return sum + billTotal;
      }, 0);
      const avgOrderValue = todayCompletedOrders.length > 0 ? todayRevenue / todayCompletedOrders.length : 0;

      const newStats = {
        myOrders: parseInt(myStats.orders) || 0,
        myRevenue: parseFloat(myStats.revenue) || 0,
        currentShiftOrders: todayCompletedOrders.length || 0, // Use completed customer orders
        avgOrderValue: avgOrderValue || 0
      };

      debugLog('Final Stats - Total Orders:', newStats.myOrders, 'Total Revenue:', newStats.myRevenue, 'Today Orders:', newStats.currentShiftOrders, 'Avg Order Value:', newStats.avgOrderValue);

      // Always update with the fetched data
      updateTodayStats(newStats);

    } catch (error) {
      console.error('Error fetching staff stats:', error);
      debugLog('Stats fetch error - status:', error.response?.status);

      // On error, try to keep existing stats if we have them
      if (todayStats.myOrders > 0 || todayStats.currentShiftOrders > 0 || todayStats.myRevenue > 0) {
        debugLog('Keeping existing stats due to API error');
        // Re-save existing stats to ensure they persist
        updateTodayStats(todayStats);
      } else {
        // Try to load from localStorage as fallback
        if (auth?.userId && auth?.hotelId) {
          const currentKey = `staffStats_${auth.userId}_${auth.hotelId}`;
          const savedStats = localStorage.getItem(currentKey);
          if (savedStats) {
            try {
              const parsed = JSON.parse(savedStats);
              debugLog('Fallback: Loading stats from localStorage due to API error');
              setTodayStats(parsed);
            } catch (e) {
              debugLog('Failed to parse saved stats as fallback');
            }
          }
        }

        if (error.response?.status !== 404) {
          toast.error('Failed to load latest stats', { position: 'top-center' });
        }
      }
    }
  };

  // Function to clear billing form
  const clearBillingForm = () => {
    setBillItems([]);
    setcustomername('');
    setMobileNumber('');
    setPaymentType('');
    setTableNumber('');
    setAddTax(false);
    setTaxPercentage(0);
    setDiningType('');
    setCarDetails('');
    setCurrentOrderId(null);
    setCurrentOrderInfo(null);
    // Hide the bill panel
    setShowBillPanel(false);
    // Force form reset by incrementing counter
    setFormResetCounter(prev => prev + 1);
  };

  // Load order data into billing system
  const loadOrderToBill = (orderData, tableNo = null) => {
    console.log('loadOrderToBill input:', orderData);
    console.log('Table number received:', tableNo);

    // ✅ If array is passed directly
    const orderItems = Array.isArray(orderData)
      ? orderData
      : orderData.items || [];

    // Add table number to each item if not already present
    const billItemsForBilling = orderItems.map((item, index) => ({
      id: `${item.productId}_${index}_${Date.now()}`,
      productId: item.productId,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      hotelId: auth.hotelId,
      tableNumber: item.tableNumber || tableNo || null, // Use passed tableNo
    }));

    // Set the table number in state
    if (tableNo) {
      setTableNumber(tableNo.toString());
      setDiningType('dine-in'); // Set dining type to dine-in
      const activeOrder = savedOrders.find(o =>
        o.tableNumber == tableNo && o.status !== 'completed'
      );
      console.log('Set table number to:', tableNo);
      if (activeOrder) {
        console.log("Found Customer for Billing:", activeOrder.customername);
        setcustomername(activeOrder.customername || '');
        setMobileNumber(activeOrder.phoneNumber || '');
      }
    }
    setBillItems(billItemsForBilling);
    setShowBillPanel(true);

    // Scroll to bill panel if needed
    setTimeout(() => {
      document.getElementById('bill-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Function to handle new order creation
  const handleNewOrder = () => {
    setShowNewOrderDialog(true);
  };

  // Handle order creation from the new dialog
  const handleOrderCreated = (newOrder) => {
    console.log('New order created:', newOrder);
    // Refresh order list
    setRefreshKey(prev => prev + 1);
    setShowNewOrderDialog(false);
    setEditingOrder(null);
  };

  // Handle order update from the dialog
  const handleOrderUpdated = (updatedOrder) => {
    console.log('Order updated:', updatedOrder);
    toast.success('Order updated successfully!');
    // Refresh order list
    setRefreshKey(prev => prev + 1);
    setShowNewOrderDialog(false);
    setEditingOrder(null);
  };

  // Function to handle order updates
  const handleUpdateOrder = (order) => {
    console.log('StaffDashboard: handleUpdateOrder called with order:', order);
    console.log('StaffDashboard: order.items:', order.items);
    console.log('StaffDashboard: order.items length:', order.items ? order.items.length : 'undefined');

    setEditingOrder(order);
    setShowNewOrderDialog(true);

    console.log('StaffDashboard: Opening dialog to edit order:', order);
  };

  // Function to handle order deletion
  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}`);
      toast.success('Order deleted successfully!', { position: 'top-center' });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order', { position: 'top-center' });
    }
  };

  // Function to save order
  const handleSaveOrder = async () => {
    console.log('StaffDashboard: handleSaveOrder called');
    console.log('StaffDashboard: orderItems before save:', orderItems);
    console.log('StaffDashboard: orderItems length:', orderItems.length);
    console.log('StaffDashboard: editingOrder:', editingOrder);

    if (orderItems.length === 0) {
      toast.warn('Please add at least one item to the order');
      return;
    }

    const orderData = {
      hotelId: auth.hotelId,
      staffId: auth.userId,
      name: ordercustomername || 'Walk-in Customer',
      customerName: ordercustomername || 'Walk-in Customer',
      customername: ordercustomername || 'Walk-in Customer',
      phone: orderMobileNumber,
      phoneNumber: orderMobileNumber,
      tableNumber: orderTableNumber,
      diningType: orderDiningType,
      carDetails: orderCarDetails,
      items: orderItems.map(item => {
        console.log('StaffDashboard: Mapping item:', item);
        const mappedItem = {
          productId: item.id,
          name: item.name,
          productName: item.name, // Add productName for compatibility
          quantity: item.quantity,
          price: item.price
        };
        console.log('StaffDashboard: Mapped to:', mappedItem);
        return mappedItem;
      }),
      totalAmount: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending'
    };

    console.log('StaffDashboard: orderData to send:', orderData);
    console.log('StaffDashboard: items in orderData:', orderData.items);
    console.log('StaffDashboard: items count in orderData:', orderData.items.length);

    try {
      if (editingOrder) {
        console.log('StaffDashboard: Updating existing order ID:', editingOrder.id);
        const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${editingOrder.id}`, orderData);
        console.log('StaffDashboard: Update response:', response.data);
        toast.success('Order updated successfully!', { position: 'top-center' });
      } else {
        console.log('StaffDashboard: Creating new order');
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/orders`, orderData);
        console.log('StaffDashboard: Create response:', response.data);
        toast.success('Order created successfully!', { position: 'top-center' });
      }

      // Reset form
      setShowMenuSection(false);
      setOrderItems([]);
      setOrdercustomername('');
      setOrderMobileNumber('');
      setOrderDiningType('');
      setOrderTableNumber('');
      setOrderCarDetails('');
      setEditingOrder(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order', { position: 'top-center' });
    }
  };

  // Function to update today's stats
  const updateTodayStats = (newStats) => {
    setTodayStats(newStats);
    // Save stats to localStorage for persistence across page refreshes
    const userId = localStorage.getItem('userId') || auth?.userId;
    const hotelId = localStorage.getItem('hotelId') || auth?.hotelId;

    if (userId && hotelId && userId !== 'undefined' && hotelId !== 'undefined' && userId !== 'null' && hotelId !== 'null') {
      const currentKey = `staffStats_${userId}_${hotelId}`;
      localStorage.setItem(currentKey, JSON.stringify(newStats));
      debugLog('Saved stats to localStorage successfully');
    } else {
      debugLog('Cannot save stats - invalid auth data');
    }
  };

  const hasRealPrinterConnection = () => {
    return printerService.isConnected &&
      printerService.selectedPrinter?.connected &&
      printerService.selectedPrinter?.type !== 'browser';
  };

  const generateBillHTML = () => {
    return `
        <html>
          <head>
            <title>Final Bill</title>
            <style>
              @media print {
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  margin: 0;
                  padding: 10px;
                  width: 80mm;
                }
                * {
                  box-sizing: border-box;
                }
              }
              @media screen {
                body {
                  font-family: Arial, sans-serif;
                  font-size: 14px;
                  padding: 20px;
                  background: #f5f5f5;
                }
                .print-preview {
                  width: 80mm;
                  margin: 0 auto;
                  background: white;
                  padding: 15px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  border: 1px solid #ddd;
                }
              }
              .receipt {
                width: 100%;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 2px dashed #000;
              }
              .restaurant-name {
                font-size: 16px;
                font-weight: bold;
                margin: 5px 0;
              }
              .address {
                font-size: 10px;
                color: #666;
                margin: 3px 0;
              }
              .bill-title {
                font-size: 14px;
                font-weight: bold;
                margin: 8px 0;
                text-align: center;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
                font-size: 11px;
              }
              .info-label {
                font-weight: bold;
                min-width: 70px;
              }
              .separator {
                border-top: 1px dashed #000;
                margin: 8px 0;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 11px;
              }
              .items-table th {
                text-align: left;
                padding: 4px 2px;
                border-bottom: 1px dashed #000;
                font-weight: bold;
              }
              .items-table td {
                padding: 4px 2px;
                border-bottom: 1px dotted #ddd;
              }
              .item-name {
                width: 60%;
              }
              .item-qty {
                width: 10%;
                text-align: center;
              }
              .item-price {
                width: 15%;
                text-align: right;
              }
              .item-total {
                width: 15%;
                text-align: right;
              }
              .total-section {
                margin-top: 15px;
                padding-top: 8px;
                border-top: 2px dashed #000;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 12px;
              }
              .grand-total {
                font-weight: bold;
                font-size: 14px;
                margin-top: 8px;
              }
              .footer {
                text-align: center;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px dashed #000;
                font-size: 10px;
                color: #666;
              }
              .thank-you {
                font-style: italic;
                margin: 10px 0;
                font-size: 11px;
              }
              .kot-info {
                font-size: 10px;
                color: #888;
                margin: 2px 0;
              }
              .kot-id {
                background: #f0f0f0;
                padding: 2px 5px;
                border-radius: 3px;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="${typeof window !== 'undefined' && window.innerWidth > 768 ? 'print-preview' : ''}">
              <div class="receipt">
                <!-- Header -->
                <div class="header">
                  <div class="restaurant-name">YOUR RESTAURANT NAME</div>
                  <div class="address">Restaurant Address Line 1</div>
                  <div class="address">City, State - PIN Code</div>
                  <div class="address">Phone: +91 XXXXX XXXXX</div>
                  <div class="address">GSTIN: XXXXXXX</div>
                </div>
                
                <!-- Bill Title -->
                <div class="bill-title">FINAL BILL</div>
                
                <!-- Customer & Order Info -->
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span>${new Date().toLocaleTimeString()}</span>
                </div>
                
                ${orderData.tableNumber ? `
                  <div class="info-row">
                    <span class="info-label">Table:</span>
                    <span>${orderData.tableNumber}</span>
                  </div>
                ` : ''}
                
                ${orderData.diningType === 'takeaway' ? `
                  <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span>Takeaway</span>
                  </div>
                ` : ''}
                
                ${orderData.customername && orderData.customername !== 'Walk-in Customer' ? `
                  <div class="info-row">
                    <span class="info-label">Customer:</span>
                    <span>${orderData.customername}</span>
                  </div>
                ` : ''}
                
                ${orderData.phoneNumber ? `
                  <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span>${orderData.phoneNumber}</span>
                  </div>
                ` : ''}
                
                ${orderData.carDetails && orderData.diningType === 'takeaway' ? `
                  <div class="info-row">
                    <span class="info-label">Vehicle:</span>
                    <span>${orderData.carDetails}</span>
                  </div>
                ` : ''}
                
                ${orderData.notes ? `
                  <div class="info-row">
                    <span class="info-label">Notes:</span>
                    <span>${orderData.notes}</span>
                  </div>
                ` : ''}
                
                <div class="separator"></div>
                
                <!-- KOT Information -->
                <div class="kot-info">
                  <div>Included KOTs:</div>
                  ${filteredKOTs.map(kot => `
                    <div>• <span class="kot-id">${kot.kotId}</span> - ${new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  `).join('')}
                </div>
                
                <div class="separator"></div>
                
                <!-- Items Table -->
                <table class="items-table">
                  <thead>
                    <tr>
                      <th class="item-name">Item</th>
                      <th class="item-qty">Qty</th>
                      <th class="item-price">Price</th>
                      <th class="item-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${billItems.map(item => `
                      <tr>
                        <td class="item-name">${item.name}</td>
                        <td class="item-qty">${item.quantity}</td>
                        <td class="item-price">₹${item.price.toFixed(2)}</td>
                        <td class="item-total">₹${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div class="separator"></div>
                
                <!-- Totals -->
                <div class="total-section">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                  </div>
                  <div class="total-row">
                    <span>GST (0%):</span>
                    <span>₹0.00</span>
                  </div>
                  <div class="total-row grand-total">
                    <span>GRAND TOTAL:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="separator"></div>
                
                <!-- Footer -->
                <div class="footer">
                  <div class="thank-you">Thank you for dining with us!</div>
                  <div>Please visit again</div>
                  <div>Generated by Restaurant POS System</div>
                  <div>Bill ID: BILL-${Date.now().toString().slice(-6)}</div>
                </div>
              </div>
            </div>
            
            <script>
              // Auto-print and close
              window.onload = function() {
                // Print immediately
                window.print();
                
                // Close window after printing (for popup)
                setTimeout(function() {
                  window.close();
                }, 1000);
              };
              
              // Handle print dialog cancellation
              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;
  };
  // Function to handle native printing
  const handleNativePrint = (billData) => {
    const printWindow = window.open('', '_blank');
    const billHTML = generateBillHTML(billData);
    printWindow.document.write(billHTML);
    printWindow.document.close();

    // Wait for images to load before printing
    const images = printWindow.document.getElementsByTagName('img');
    if (images.length > 0) {
      let loadedImages = 0;
      const totalImages = images.length;

      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages >= totalImages) {
          setTimeout(() => {
            printWindow.print();
          }, 500); // Small delay to ensure rendering
        }
      };

      // Set up load/error handlers for each image
      for (let i = 0; i < images.length; i++) {
        if (images[i].complete) {
          checkAllLoaded();
        } else {
          images[i].onload = checkAllLoaded;
          images[i].onerror = checkAllLoaded; // Count failed loads too
        }
      }
    } else {
      // No images, print immediately
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  // Function to handle confirm and print
  const handleConfirmAndPrint = async () => {
    await handleConfirmPayment();
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/${auth.hotelId}`);
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to load products', err);
        toast.error('Failed to load products', { position: 'top-center' });
      }
    };

    if (auth.hotelId && auth.userId && auth.userId !== 'undefined' && auth.hotelId !== 'undefined') {
      fetchProducts();

      // Delay stats fetch to allow localStorage loading to complete first
      setTimeout(() => {
        fetchStaffStats();
      }, 1000);
      // Set up socket connection for real-time updates
      socket.emit('joinHotelRoom', auth.hotelId);
      // Listen for bill creation events to refresh stats
      socket.on('billCreated', (data) => {
        debugLog('Staff dashboard received billCreated event - refreshing stats');
        // Refresh stats when any bill is created
        fetchStaffStats();
        fetchOrders();
        fetchCompletedOrders();
        fetchTakeawayOrders();
        setRefreshKey(prev => prev + 1); // Trigger refresh of child components
      });

    }
  }, [auth.hotelId, auth.userId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'counter') {
      navigate('/');
    }
  }, [navigate]);

  // Cleanup effect to handle user/hotel changes and load saved stats
  useEffect(() => {
    const userId = localStorage.getItem('userId') || auth?.userId;
    const hotelId = localStorage.getItem('hotelId') || auth?.hotelId;

    debugLog('Cleanup effect - checking auth values');

    if (userId && hotelId && userId !== 'undefined' && hotelId !== 'undefined' && userId !== 'null' && hotelId !== 'null') {
      // Load saved stats when auth becomes available
      const currentKey = `staffStats_${userId}_${hotelId}`;
      const savedStats = localStorage.getItem(currentKey);

      debugLog('Cleanup effect - looking for saved stats');
      debugLog('Cleanup effect - found stats:', savedStats ? 'Yes' : 'No');

      if (savedStats) {
        try {
          const parsed = JSON.parse(savedStats);
          debugLog('Cleanup effect - Loading saved stats for current user');
          setTodayStats(parsed);
        } catch (e) {
          debugLog('Failed to parse saved stats for current user');
        }
      }

      // Clear any old stats when user/hotel changes
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('staffStats_'));
      allKeys.forEach(key => {
        if (key !== currentKey) {
          debugLog('Removing old stats key');
          localStorage.removeItem(key);
        }
      });

      // Fetch fresh stats after loading saved ones - only if we have auth data
      if (auth?.userId && auth?.hotelId) {
        setTimeout(() => {
          debugLog('Fetching fresh stats after cleanup effect');
          fetchStaffStats();
        }, 500);
      }
    }
  }, [auth?.userId, auth?.hotelId]);

  const handleAddToBill = (product) => {
    // Find existing item by productId
    const existing = billItems.find(item => (item.productId || item.id) === product.id);
    if (existing) {
      setBillItems(prev =>
        prev.map(item =>
          (item.productId || item.id) === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      // Create new item with unique ID and productId reference
      const newItem = {
        id: `${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID for React keys
        productId: product.id, // Original product ID for API calls
        name: product.name,
        price: product.price,
        quantity: 1
      };
      setBillItems([...billItems, newItem]);
    }
  };

  // Separate function for adding items to order (not billing)
  const handleAddToOrder = (product) => {
    const existing = orderItems.find(item => item.id === product.id);
    if (existing) {
      setOrderItems(prev =>
        prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }]);
    }
  };

  // Function to update order item quantity
  const updateOrderItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveOrderItem(productId);
      return;
    }
    setOrderItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: quantity } : item
      )
    );
  };

  const handleRemoveOrderItem = (productId) => {
    const removedItem = orderItems.find(item => item.id === productId);
    setOrderItems(prev => prev.filter(item => item.id !== productId));
    if (removedItem) {
      toast.info(`${removedItem.name} removed from order`);
    }
  };

  const handleRemoveItem = (productId) => {
    const removedItem = billItems.find(item => item.id === productId);
    setBillItems(prev => prev.filter(item => item.id !== productId));
    if (removedItem) {
      toast.info(`${removedItem.name} removed from bill`, {
        position: 'top-center',
        autoClose: 1500
      });
    }
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setBillItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const total = billItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitBill = () => {
    console.log('===================Submitting bill with items:', billItems);
    if (billItems.length === 0) {
      toast.warn('Please add at least one item to the bill.');
      return;
    }
    if (!paymentType) {
      toast.error('Please select payment type.');
      return;
    }
    setShowModal(true);
  };

  useEffect(() => {
    const fetchHotelInfo = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/${auth.hotelId}`);
        const { name, address, phone, gstin, profileImage } = res.data;
        setHotelInfo({ name, address, phone, gstin, profileImage });
      } catch (error) {
        toast.error("Failed to load hotel information");
        console.error("Hotel info fetch error:", error);
      }
    };

    if (auth.hotelId) {
      fetchHotelInfo();
    }
  }, [auth.hotelId]);

  // Navigation protection - warn before leaving dashboard
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      setShowLogoutConfirm(true);
      // Push the current state back to prevent navigation
      window.history.pushState(null, '', window.location.href);
    };

    // Add event listeners (removed beforeunload to allow auto-refresh)
    window.addEventListener('popstate', handlePopState);

    // Push initial state to enable back button detection
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle logout confirmation
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    // Clear auth and navigate to home
    localStorage.clear();
    navigate('/');
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmPayment = async () => {
    console.log('===================Confirming payment with items:', billItems);

    const taxAmt = addTax ? (total * taxPercentage) / 100 : 0;
    const finalTotal = total + taxAmt;
    const payload = {
      hotelId: auth.hotelId,
      staffId: auth.userId,
      name: customername || 'Walk-in Customer',
      customername: customername || 'Walk-in Customer',
      phone: mobileNumber || 'N/A',
      phoneNumber: mobileNumber || 'N/A',
      contact: mobileNumber || 'N/A',
      paymentType,
      items: billItems.map(item => ({
        productId: item.productId || item.id, // Use productId if available, otherwise use id
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        tableNumber: diningType === 'dine-in' ? tableNumber : null
      })),
      total: finalTotal,
      tableNumber: diningType === 'dine-in' ? (tableNumber || null) : null,
      diningType: diningType || null,
      carDetails: diningType === 'takeaway' ? (carDetails || null) : null,
      addTax,
      taxPercentage: addTax ? taxPercentage : 0,
      taxAmount: addTax ? (total * taxPercentage) / 100 : 0,
      // ✅ ADD THESE TWO FIELDS:
      orderId: currentOrderId, // Pass the order ID
      orderNumber: currentOrderInfo?.orderNumber // Pass the order number if available
    };

    console.log('🔍 Creating bill with orderId:', currentOrderId);
    console.log('🔍 Full payload:', payload);

    try {
      // 1. Create the bill (this will update the order status in billController)
      const billResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/bill/create`, payload);

      console.log('✅ Bill created:', billResponse.data);

      // 2. Print the bill
      handleNativePrint({
        customername: customername || 'Walk-in Customer',
        mobileNumber,
        paymentType,
        billItems,
        total,
        tableNumber: diningType === 'dine-in' ? (tableNumber || null) : null,
        diningType: diningType || null,
        carDetails: diningType === 'takeaway' ? (carDetails || null) : null,
        addTax,
        taxPercentage: addTax ? taxPercentage : 0,
        taxAmount: addTax ? (total * taxPercentage) / 100 : 0,
        finalTotal: addTax ? total + ((total * taxPercentage) / 100) : total,
        hotelInfo: {
          name: hotelInfo.name,
          address: hotelInfo.address,
          gstin: hotelInfo.gstin || '',
          profileImage: hotelInfo.profileImage
        }
      });

      toast.success('Bill submitted successfully!', { position: "top-center", autoClose: 2000 });

      generatePDF();

      setTimeout(() => {
        fetchStaffStats();
      }, 1000);

      // Reset
      setBillItems([]);
      setcustomername('');
      setMobileNumber('');
      setPaymentType('');
      setTableNumber('');
      setDiningType('');
      setCarDetails('');
      setAddTax(false);
      setTaxPercentage(0);
      setCurrentOrderId(null); // Clear the current order
      setCurrentOrderInfo(null); // Clear order info
      setShowModal(false);

      // Auto-refresh page after successful billing to reset all states
      setTimeout(() => {
        toast.info('Refreshing page...', { position: "top-center", autoClose: 1000 });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 2000); // Slight delay to let the success toast show
      setDiscount(0)
    } catch (error) {
      console.error('❌ Error submitting bill:', error);
      toast.error('Something went wrong while submitting the bill.', { position: "top-center" });
    }
  };

  // Print bill
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Customer Bill", 14, 20);

    doc.setFontSize(12);
    doc.text(`Customer Name: ${customername}`, 14, 30);
    doc.text(`Mobile Number: ${mobileNumber}`, 14, 36);
    doc.text(`Payment Type: ${paymentType}`, 14, 42);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 48);

    autoTable(doc, {
      startY: 55,
      head: [['Product Name', 'Quantity', 'Price (₹)', 'Total (₹)']],
      body: billItems.map(item => [
        item.name,
        item.quantity,
        item.price,
        item.quantity * item.price,
      ]),
    });

    doc.setFontSize(14);
    doc.text(`Total: ₹${total}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save(`Bill_${customername}_${Date.now()}.pdf`);
  };

  // Function to handle refresh
  const handleRefresh = () => {
    loadPendingTakeawayOrders();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faUser} className="mr-3 text-indigo-600" />
                  Counter Dashboard
                </h1>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <FontAwesomeIcon icon={faStore} className="mr-2 text-gray-400" />
                  Welcome, {auth.name} | Hotel ID: #{auth.hotelId}
                </p>
              </div>
            </div>

            {/* Today's Performance Stats */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faReceipt} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Today's Orders</p>
                    <p className="text-sm font-bold text-blue-800">{todayStats.currentShiftOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">My Total Revenue</p>
                    <p className="text-sm font-bold text-green-800">₹{todayStats.myRevenue?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faChartLine} className="text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-600 font-medium">Avg Order Value</p>
                    <p className="text-sm font-bold text-purple-800">₹{Math.round(todayStats.avgOrderValue) || 0}</p>
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
            <p className="text-sm font-bold text-blue-800">{todayStats.currentShiftOrders}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-2 text-center">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600 mb-1" />
            <p className="text-xs text-green-600 font-medium">Revenue</p>
            <p className="text-sm font-bold text-green-800">₹{Math.round(todayStats.myRevenue) || 0}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-2 py-2 text-center">
            <FontAwesomeIcon icon={faChartLine} className="text-purple-600 mb-1" />
            <p className="text-xs text-purple-600 font-medium">Avg</p>
            <p className="text-sm font-bold text-purple-800">₹{Math.round(todayStats.avgOrderValue) || 0}</p>
          </div>
        </div>
      </div>

      {/* Current Order Summary - if items in bill */}
      {billItems.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faShoppingCart} className="text-indigo-600" />
                <span className="text-sm font-medium text-indigo-800">
                  Current Order: {billItems.length} item{billItems.length !== 1 ? 's' : ''}
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
        <div className={`grid gap-6 ${showBillPanel ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Order Management Section - Now Primary */}
          <div className={`${showBillPanel ? 'lg:col-span-2' : 'col-span-1'} order-2 lg:order-1`}>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-4 py-4 sm:px-6 border-b border-gray-200"></div>
              <div className="grid grid-cols-2 gap-3 w-full lg:flex lg:items-center lg:justify-start lg:gap-6">
                <h2 className="
                  text-lg font-semibold text-gray-900 
                  flex items-center 
                  col-span-1 pl-5
                ">
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-gray-600" />
                  KOT
                </h2>
                <div className="px-5 py-1 rounded-md text-right col-span-1 flex justify-end">
                  {totalTableNumber ? (
                    <p className="text-lg font-bold whitespace-nowrap">Total Table: {totalTableNumber}</p>
                  ) : (
                    <p className="text-sm text-gray-500">No table assigned</p>
                  )}
                </div>
                <div className="col-span-2 flex flex-col sm:flex-row gap-2 w-full lg:col-span-1 lg:flex-row lg:justify-end">
                  {!showBillPanel && (
                    <button
                      onClick={() => setShowBillPanel(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
                    >
                      <FontAwesomeIcon icon={faReceipt} className="mr-2" />
                      Show Bill Panel
                    </button>
                  )}

                  <div className="flex flex-col justify-center w-full sm:w-auto">
                    <button
                      onClick={handleConnectPrinter}
                      disabled={isConnectingToPrinter}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium w-full sm:w-auto ${hasRealPrinterConnection()
                        ? 'text-green-800 hover:text-white-900'
                        : 'bg-blue-800 text-white hover:bg-white'
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

                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg w-full sm:w-auto"
                    title="Refresh orders"
                  >
                    <FontAwesomeIcon icon={faSync} className="mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="p-6">

                {/* Tab Navigation */}
                <div className="mb-6 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('table-orders')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'table-orders'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-gray-200'
                        }`}
                    >
                      <FontAwesomeIcon icon={faTable} className="mr-2" />
                      Table Orders ({Array.isArray(savedOrders) ? savedOrders.length : 0})
                    </button>

                    <button
                      onClick={() => setActiveTab('completed')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'completed'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      Completed Orders ({completedOrders.length})
                    </button>

                    <button
                      onClick={() => setActiveTab('takeaway')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'takeaway'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
                      Takeaway Orders ({pendingTakeawayOrders.length})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'table-orders' && (
                  <TableWiseOrders
                    savedOrders={savedOrders}
                    totalTableNumber={totalTableNumber}
                    onSettleBill={loadOrderToBill}
                    onOpenNewOrderDialog={handleOpenNewOrderDialogForTable}
                  />
                )}

                {activeTab === 'completed' && (
                  <CompletedOrdersTab
                    orders={completedOrders}
                    onViewDetails={handleViewOrderDetails}
                  />
                )}

                {activeTab === 'takeaway' && (
                  <TakeawayOrdersTab
                    orders={takeawayOrders}
                    onAddMore={handleAddMoreToTakeaway}
                    onPrintReceipt={handlePrintTakeawayReceipt}
                    onSettleTakeawayBill={handleSettleTakeawayBill}
                    pendingTakeawayOrders={pendingTakeawayOrders}
                    onRefresh={handleRefresh}
                    onSetTakeaway={handleSetTakeaway}
                    onViewDetails={handleViewTakeawayDetails}
                  />
                )}

                {showBillPanel && (
                  <>
                    <SettleBillModal
                      isOpen={showBillPanel}
                      onClose={() => setShowBillPanel(false)}
                      billItems={billItems}
                      total={total}
                      finalTotal={finalTotal}
                      setFinalTotal={setFinalTotal}
                      customername={customername}
                      setCustomerName={setcustomername}
                      mobileNumber={mobileNumber}
                      setMobileNumber={setMobileNumber}
                      paymentType={paymentType}
                      setPaymentType={setPaymentType}
                      diningType={diningType}
                      setDiningType={setDiningType}
                      tableNumber={tableNumber}
                      setTableNumber={setTableNumber}
                      carDetails={carDetails}
                      setCarDetails={setCarDetails}
                      addTax={addTax}
                      setAddTax={setAddTax}
                      taxPercentage={taxPercentage}
                      setTaxPercentage={setTaxPercentage}
                      handleConfirmPayment={handlePayment}
                      printerStatus={printerStatus}
                      autoPrintEnabled={autoPrintEnabled}
                      setAutoPrintEnabled={setAutoPrintEnabled}
                      isConnectingToPrinter={isConnectingToPrinter}
                      onReconnectPrinter={handleReconnectPrinter}
                    />

                    <DirectBillModal
                      isOpen={showBillPanel}
                      onClose={() => setShowBillPanel(false)}
                      billItems={billItems}
                      total={total}
                      taxPercentage={taxPercentage}
                      setTaxPercentage={setTaxPercentage}
                      paymentType={paymentType}
                      setPaymentType={setPaymentType}
                      handleConfirmPayment={handlePayment}
                      discount={discount}
                      setDiscount={setDiscount}
                      discountType={discountType}
                      setDiscountType={setDiscountType}
                      mobileNumber={mobileNumber}

                    />
                  </>
                )}
                {showTakeawayDetailsModal && selectedTakeawayOrder && (
                  <TakeawayOrderDetailsModal
                    order={selectedTakeawayOrder}
                    isOpen={showTakeawayDetailsModal}
                    onClose={() => {
                      setShowTakeawayDetailsModal(false);
                      setSelectedTakeawayOrder(null);
                    }}
                    onSettle={() => {
                      handleSettleTakeawayBill(selectedTakeawayOrder);
                      setShowTakeawayDetailsModal(false);
                      setSelectedTakeawayOrder(null);
                    }}
                  />
                )}
                {/* Collapsible Menu Section */}
                {showMenuSection && (
                  <div ref={menuSectionRef} className="mt-6 border-t pt-6">
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-col h-[85vh]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-900">
                          {editingOrder ? 'Update KOT' : 'Create New KOT'}
                        </h3>
                        <button
                          onClick={() => {
                            setShowMenuSection(false);
                            setOrderItems([]);
                            setOrdercustomername('');
                            setOrderMobileNumber('');
                            setOrderDiningType('');
                            setOrderTableNumber('');
                            setOrderCarDetails('');
                            setEditingOrder(null);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>

                      {/* Customer Details Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-shrink-0">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name
                          </label>
                          <input
                            type="text"
                            value={ordercustomername}
                            onChange={(e) => setOrdercustomername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Enter customer name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={orderMobileNumber}
                            onChange={(e) => setOrderMobileNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Enter mobile number"
                          />
                        </div>
                        <div className="w-full mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dining Type
                          </label>
                          <select
                            value={orderDiningType}
                            onChange={(e) => {
                              setOrderDiningType(e.target.value);
                              if (e.target.value === 'takeaway') setOrderTableNumber('');
                              if (e.target.value === 'dine-in') setOrderCarDetails('');
                            }}
                            className="block w-full appearance-none px-4 py-2 border border-gray-300 rounded-md bg-white text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">Select dining type</option>
                            <option value="dine-in">🍽️ Dine-In</option>
                            <option value="takeaway">🥡 Takeaway</option>
                          </select>
                        </div>

                        {orderDiningType === 'dine-in' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Table Number
                            </label>
                            <input
                              type="text"
                              value={orderTableNumber}
                              onChange={(e) => setOrderTableNumber(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Enter table number"
                            />
                          </div>
                        )}
                        {orderDiningType === 'takeaway' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Car Number
                            </label>
                            <input
                              type="text"
                              value={orderCarDetails}
                              onChange={(e) => setOrderCarDetails(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Enter car number/details"
                            />
                          </div>
                        )}
                      </div>

                      {/* Menu Items - Scrollable */}
                      <div className="mb-4 flex-1 overflow-hidden flex flex-col">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex-shrink-0">Select Items</h4>
                        <div className="flex-1 overflow-y-auto">
                          <ProductList
                            products={products}
                            search={search}
                            setSearch={setSearch}
                            handleAddToBill={handleAddToOrder}
                            selectedItems={orderItems}
                            updateQuantity={updateOrderItemQuantity}
                            removeItem={handleRemoveOrderItem}
                          />
                        </div>
                      </div>

                      {/* Fixed Order Summary Section */}
                      <div className="flex-shrink-0 border-t pt-4 bg-gray-50">
                        {/* Order Items Display */}
                        {orderItems.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items</h4>
                            <div className="bg-white rounded-md border p-3 max-h-32 overflow-y-auto">
                              {orderItems.map((item, index) => (
                                <div key={`order-item-${item.id}-${index}`} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                  <span className="text-sm">{item.name}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm">Qty: {item.quantity}</span>
                                    <span className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    <button
                                      onClick={() => handleRemoveOrderItem(item.id)}
                                      className="text-red-500 hover:text-red-700 text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <div className="pt-2 mt-2 border-t">
                                <div className="flex justify-between items-center font-semibold">
                                  <span>Total:</span>
                                  <span>₹{orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={handleSaveOrder}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                          >
                            <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                            {editingOrder ? 'Update Order' : 'Save Order'}
                          </button>
                          <button
                            onClick={() => {
                              setShowMenuSection(false);
                              setOrderItems([]);
                              setOrdercustomername('');
                              setOrderMobileNumber('');
                              setOrderDiningType('');
                              setOrderTableNumber('');
                              setEditingOrder(null);
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <OrderForm
        isOpen={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        hotelId={auth.hotelId}
        onOrderCreated={() => {
          setShowOrderForm(false);
          setRefreshKey(prev => prev + 1);
        }}
      />

      <NewOrderDialog
        isOpen={showNewOrderDialog}
        onClose={() => {
          setShowNewOrderDialog(false);
          setEditingOrder(null);
          setSelectedTableForDialog(null);
          setForceTakeawayMode(false);
          setPrefillOrderData(null);
        }}
        role={auth.role}
        hotelId={auth.hotelId}
        staffId={auth.userId}
        onOrderCreated={handleOrderCreated}
        onTakeawayOrderCreated={handleTakeawayOrderCreated}
        editingOrder={editingOrder}
        onOrderUpdated={handleOrderUpdated}
        onPrintKOT={onPrintKOT}
        printSingleKOT={printSingleKOT}
        onKOTSave={handleKOTSave}
        savedKOTs={savedKOTs}
        onDeleteKot={handleDeleteKot}
        handleCounterCreateOrder={handleCreateOrder}
        initialTableNumber={selectedTableForDialog}
        initialDiningType={selectedTableForDialog ? 'dine-in' : null}
        forceDiningType={forceTakeawayMode ? 'takeaway' : null} // Pass forced type
        handlePrintBill={handlePrintBill}
        prefillData={prefillOrderData}
      />

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faShoppingCart} className="text-yellow-500 text-xl mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to go back? This will log you out of your dashboard and you'll need to login again.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={handleLogoutCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Stay on Dashboard
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout & Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default StaffDashboard;