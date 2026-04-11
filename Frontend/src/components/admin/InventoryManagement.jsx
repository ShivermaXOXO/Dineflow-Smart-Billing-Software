import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faPlus, 
  faFilter, 
  faDownload, 
  faExclamationTriangle,
  faChartLine,
  faCalendarAlt,
  faSearch,
  faEdit,
  faTrash,
  faEye,
  faClock,
  faWarning,
  faFile,
  faFileExcel,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const InventoryManagement = ({ hotelId }) => {
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    month: '',
    year: new Date().getFullYear()
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'raw_materials', label: 'Raw Materials' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'packaged_goods', label: 'Packaged Goods' },
    { value: 'cleaning_supplies', label: 'Cleaning Supplies' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'expired', label: 'Expired' }
  ];

  const units = ['kg', 'g', 'liters', 'ml', 'pieces', 'packets', 'boxes', 'bottles'];

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/inventory/${hotelId}?${params}`
      );
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/inventory/analytics/${hotelId}?year=${filters.year}`
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchInventory();
      fetchAnalytics();
    }
  }, [hotelId, filters]);

  const filteredInventory = inventory.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'low_stock': return 'text-yellow-600 bg-yellow-100';
      case 'out_of_stock': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      case 'expired': return 'Expired';
      default: return status.replace('_', ' ');
    }
  };

  const formatCurrency = (amount) => `₹${parseFloat(amount).toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

  // Export functions
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Inventory Report', 14, 22);
      
      // Add hotel info and date
      doc.setFontSize(12);
      doc.text(`Hotel ID: ${hotelId}`, 14, 35);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 45);
      doc.text(`Total Items: ${filteredInventory.length}`, 14, 55);
      
      // Prepare table data
      const tableData = filteredInventory.map(item => [
        item.itemName,
        item.category.replace('_', ' '),
        `${item.currentStock} ${item.unit}`,
        getStatusLabel(item.status),
        formatCurrency(item.totalCost),
        item.supplier || 'N/A',
        formatDate(item.purchaseDate),
        item.expiryDate ? formatDate(item.expiryDate) : 'N/A'
      ]);
      
      // Add table
      doc.autoTable({
        head: [['Item Name', 'Category', 'Stock', 'Status', 'Total Cost', 'Supplier', 'Purchase Date', 'Expiry Date']],
        body: tableData,
        startY: 65,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Save the PDF
      doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully!');
      setShowExportDropdown(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredInventory.map(item => ({
        'Item Name': item.itemName,
        'Category': item.category.replace('_', ' '),
        'Current Stock': item.currentStock,
        'Unit': item.unit,
        'Quantity Purchased': item.quantityPurchased,
        'Status': getStatusLabel(item.status),
        'Cost Per Unit': item.costPerUnit,
        'Total Cost': item.totalCost,
        'Min Stock Level': item.minStockLevel,
        'Supplier': item.supplier || 'N/A',
        'Purchase Date': formatDate(item.purchaseDate),
        'Expiry Date': item.expiryDate ? formatDate(item.expiryDate) : 'N/A',
        'Created Date': formatDate(item.createdat),
        'Last Updated': formatDate(item.updatedat)
      }));
      
      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Item Name
        { wch: 15 }, // Category
        { wch: 12 }, // Current Stock
        { wch: 8 },  // Unit
        { wch: 15 }, // Quantity Purchased
        { wch: 12 }, // Status
        { wch: 12 }, // Cost Per Unit
        { wch: 12 }, // Total Cost
        { wch: 12 }, // Min Stock Level
        { wch: 15 }, // Supplier
        { wch: 12 }, // Purchase Date
        { wch: 12 }, // Expiry Date
        { wch: 12 }, // Created Date
        { wch: 12 }  // Last Updated
      ];
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');
      
      // Generate buffer and save
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Excel file exported successfully!');
      setShowExportDropdown(false);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const handleUpdateStock = async (item, quantityUsed, reason) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/inventory/stock/${item.id}`,
        { quantityUsed, reason }
      );
      toast.success('Stock updated successfully');
      fetchInventory();
      setShowStockModal(false);
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/inventory/${id}`);
        toast.success('Item deleted successfully');
        fetchInventory();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faBox} className="mr-3 text-indigo-600" />
              Inventory Management
            </h2>
            <p className="text-gray-600 mt-1">Track raw materials, supplies, and stock levels</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {analytics?.alerts && (analytics.alerts.lowStockItems.length > 0 || analytics.alerts.expiringSoonItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.alerts.lowStockItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 flex items-center mb-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                Low Stock Alert ({analytics.alerts.lowStockItems.length})
              </h3>
              <div className="space-y-1">
                {analytics.alerts.lowStockItems.slice(0, 3).map(item => (
                  <p key={item.id} className="text-sm text-yellow-700">
                    {item.itemName}: {item.currentStock} remaining (min: {item.minStockLevel})
                  </p>
                ))}
                {analytics.alerts.lowStockItems.length > 3 && (
                  <p className="text-sm text-yellow-600">
                    +{analytics.alerts.lowStockItems.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {analytics.alerts.expiringSoonItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 flex items-center mb-2">
                <FontAwesomeIcon icon={faClock} className="mr-2" />
                Expiring Soon ({analytics.alerts.expiringSoonItems.length})
              </h3>
              <div className="space-y-1">
                {analytics.alerts.expiringSoonItems.slice(0, 3).map(item => (
                  <p key={item.id} className="text-sm text-red-700">
                    {item.itemName}: expires in {item.daysUntilExpiry} days
                  </p>
                ))}
                {analytics.alerts.expiringSoonItems.length > 3 && (
                  <p className="text-sm text-red-600">
                    +{analytics.alerts.expiringSoonItems.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search items or suppliers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              min="1900"
              max="2100"
              placeholder="Enter year"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Inventory Items ({filteredInventory.length})
          </h3>
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-indigo-50 transition-colors"
            >
              <FontAwesomeIcon icon={faDownload} />
              <span>Export</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={exportToPDF}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <FontAwesomeIcon icon={faFile} className="text-red-500" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <FontAwesomeIcon icon={faFileExcel} className="text-green-500" />
                    <span>Export as Excel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-sm text-gray-500">
                            {item.quantityPurchased} {item.unit} purchased
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.currentStock} {item.unit}
                      </div>
                      {item.minStockLevel > 0 && (
                        <div className="text-xs text-gray-500">
                          Min: {item.minStockLevel} {item.unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(item.totalCost)}</div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(item.costPerUnit)}/{item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplier || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.purchaseDate)}
                      {item.expiryDate && (
                        <div className="text-xs text-gray-500">
                          Exp: {formatDate(item.expiryDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowStockModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Update Stock"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Item"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <AddInventoryModal
          hotelId={hotelId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchInventory();
          }}
          categories={categories}
          units={units}
        />
      )}

      {/* Stock Update Modal */}
      {showStockModal && selectedItem && (
        <StockUpdateModal
          item={selectedItem}
          onClose={() => setShowStockModal(false)}
          onUpdate={handleUpdateStock}
        />
      )}
    </div>
  );
};

// Add Item Modal Component
const AddInventoryModal = ({ hotelId, onClose, onSuccess, categories, units }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'raw_materials',
    unit: 'kg',
    quantityPurchased: '',
    costPerUnit: '',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    minStockLevel: '',
    maxStockLevel: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/inventory/create`, {
        ...formData,
        hotelId
      });
      toast.success('Inventory item added successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to add inventory item');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Inventory Item</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.filter(cat => cat.value !== 'all').map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Purchased *</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.quantityPurchased}
                onChange={(e) => setFormData({ ...formData, quantityPurchased: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit *</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stock Update Modal Component
const StockUpdateModal = ({ item, onClose, onUpdate }) => {
  const [quantityUsed, setQuantityUsed] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(item, quantityUsed, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Update Stock Level</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <strong>{item.itemName}</strong><br />
              Current Stock: {item.currentStock} {item.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Used ({item.unit}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              max={item.currentStock}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={quantityUsed}
              onChange={(e) => setQuantityUsed(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Used for production, Wastage, etc."
            ></textarea>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Update Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryManagement;
