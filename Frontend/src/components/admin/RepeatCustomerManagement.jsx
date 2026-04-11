import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faRefresh, 
  faTrash, 
  faEye,
  faTimes,
  faCalendarAlt,
  faMoneyBillWave,
  faPhone,
  faUser,
  faFilePdf,
  faFileExcel,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const RepeatCustomerManagement = ({ hotelId }) => {
  const [repeatCustomers, setRepeatCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch repeat customers
  const fetchRepeatCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/repeat-customers/hotel/${hotelId}`);
      setRepeatCustomers(response.data);
    } catch (error) {
      console.error('Error fetching repeat customers:', error);
      toast.error('Failed to fetch repeat customers');
    } finally {
      setLoading(false);
    }
  };

  // Update repeat customers (identify new ones)
  const updateRepeatCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/repeat-customers/hotel/${hotelId}/update`);
      toast.success(`Updated! Found ${response.data.identifiedCount} repeat customers`);
      fetchRepeatCustomers();
    } catch (error) {
      console.error('Error updating repeat customers:', error);
      toast.error('Failed to update repeat customers');
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString('en-IN');
      
      // Add header
      doc.setFontSize(20);
      doc.text('Repeat Customers Report', 14, 22);
      doc.setFontSize(12);
      doc.text(`Hotel ID: ${hotelId}`, 14, 30);
      doc.text(`Generated on: ${currentDate}`, 14, 36);
      doc.text(`Total Customers: ${repeatCustomers.length}`, 14, 42);
      
      // Prepare data for table
      const tableData = repeatCustomers.map(customer => [
        customer.customername,
        customer.phoneNumber,
        customer.totalVisits,
        `₹${customer.totalSpent.toLocaleString()}`,
        customer.lastVisitDate ? new Date(customer.lastVisitDate).toLocaleDateString('en-IN') : 'N/A',
        new Date(customer.firstIdentifiedDate).toLocaleDateString('en-IN')
      ]);
      
      // Add table using autoTable
      autoTable(doc, {
        head: [['Customer Name', 'Phone Number', 'Total Visits', 'Total Spent', 'Last Visit', 'First Identified']],
        body: tableData,
        startY: 50,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] }
      });
      
      // Add summary at the bottom
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      const totalRevenue = repeatCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
      const avgVisits = repeatCustomers.length > 0 
        ? Math.round(repeatCustomers.reduce((sum, customer) => sum + customer.totalVisits, 0) / repeatCustomers.length)
        : 0;
      
      doc.text(`Summary:`, 14, finalY);
      doc.text(`• Total Revenue from Repeat Customers: ₹${totalRevenue.toLocaleString()}`, 14, finalY + 6);
      doc.text(`• Average Visits per Customer: ${avgVisits}`, 14, finalY + 12);
      
      // Save the PDF
      doc.save(`repeat-customers-hotel-${hotelId}-${currentDate.replace(/\//g, '-')}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const currentDate = new Date().toLocaleDateString('en-IN');
      
      // Prepare data for Excel
      const excelData = repeatCustomers.map(customer => ({
        'Customer Name': customer.customername,
        'Phone Number': customer.phoneNumber,
        'Total Visits': customer.totalVisits,
        'Total Spent (₹)': customer.totalSpent,
        'Last Visit Date': customer.lastVisitDate ? new Date(customer.lastVisitDate).toLocaleDateString('en-IN') : 'N/A',
        'First Identified Date': new Date(customer.firstIdentifiedDate).toLocaleDateString('en-IN'),
        'Status': customer.isActive ? 'Active' : 'Inactive'
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add summary data at the top
      const totalRevenue = repeatCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
      const avgVisits = repeatCustomers.length > 0 
        ? Math.round(repeatCustomers.reduce((sum, customer) => sum + customer.totalVisits, 0) / repeatCustomers.length)
        : 0;
      
      // Insert summary rows at the beginning
      XLSX.utils.sheet_add_aoa(ws, [
        ['Repeat Customers Report'],
        [`Hotel ID: ${hotelId}`],
        [`Generated on: ${currentDate}`],
        [`Total Customers: ${repeatCustomers.length}`],
        [`Total Revenue: ₹${totalRevenue.toLocaleString()}`],
        [`Average Visits per Customer: ${avgVisits}`],
        [''], // Empty row
        ['Customer Name', 'Phone Number', 'Total Visits', 'Total Spent (₹)', 'Last Visit Date', 'First Identified Date', 'Status']
      ], { origin: 'A1' });
      
      // Adjust column widths
      const colWidths = [
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Phone Number
        { wch: 12 }, // Total Visits
        { wch: 15 }, // Total Spent
        { wch: 15 }, // Last Visit Date
        { wch: 18 }, // First Identified Date
        { wch: 10 }  // Status
      ];
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Repeat Customers');
      
      // Save the Excel file
      XLSX.writeFile(wb, `repeat-customers-hotel-${hotelId}-${currentDate.replace(/\//g, '-')}.xlsx`);
      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  // Delete repeat customer
  const deleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to remove this customer from the repeat customers list?')) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/repeat-customers/${customerId}`);
      toast.success('Customer removed successfully');
      fetchRepeatCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to remove customer');
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Select all customers
  const selectAllCustomers = () => {
    if (selectedCustomers.length === repeatCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(repeatCustomers.map(customer => customer.id));
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchRepeatCustomers();
    }
  }, [hotelId]);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');
  const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faUsers} className="mr-3 text-purple-600" />
              Repeat Customer Management
            </h2>
            <p className="text-gray-600 mt-1">Manage and engage with your loyal customers</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={updateRepeatCustomers}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <FontAwesomeIcon icon={faRefresh} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Update List
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={repeatCustomers.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-gray-400"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500">Total Repeat Customers</dt>
                <dd className="text-2xl font-semibold text-gray-900">{repeatCustomers.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faMoneyBillWave} className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500">Total Revenue from Repeat Customers</dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(repeatCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0))}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500">Avg Visits per Customer</dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {repeatCustomers.length > 0 
                    ? Math.round(repeatCustomers.reduce((sum, customer) => sum + Number(customer.totalVisits), 0) / repeatCustomers.length)
                    : 0
                  }
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Customer List</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <FontAwesomeIcon icon={faRefresh} className="animate-spin mr-2" />
                    Loading customers...
                  </td>
                </tr>
              ) : repeatCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No repeat customers found. Click "Update List" to identify repeat customers.
                  </td>
                </tr>
              ) : (
                repeatCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{customer.customername}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{customer.phoneNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {customer.totalVisits} visits
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.lastVisitDate ? formatDate(customer.lastVisitDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove Customer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FontAwesomeIcon icon={faDownload} className="mr-2 text-blue-600" />
                Export Customer Report
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Export {repeatCustomers.length} repeat customers to share with the super admin.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    exportToPDF();
                    setShowExportModal(false);
                  }}
                  className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                  Export as PDF
                </button>
                <button
                  onClick={() => {
                    exportToExcel();
                    setShowExportModal(false);
                  }}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
                  Export as Excel
                </button>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-800">
                  <strong>Note:</strong> The exported file will include customer names, phone numbers, visit counts, total spending, and visit dates for analysis by the super admin and to be sent to tech team.
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-600 hover:border-red-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepeatCustomerManagement;
