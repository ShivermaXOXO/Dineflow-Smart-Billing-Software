import React, { useState, useEffect } from 'react';
import printerService from '../services/printerService';

const PrinterConfig = ({ hotelId }) => {
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    detectPrinters();
  }, [hotelId]);

  const detectPrinters = async () => {
    setIsLoading(true);
    setStatus('Detecting printers...');
    
    try {
      const printers = await printerService.detectAllPrinters();
      setAvailablePrinters(printers);
      setSelectedPrinter(printerService.selectedPrinter);
      
      if (printers.length > 0) {
        setStatus(`Found ${printers.length} printer(s)`);
      } else {
        setStatus('No printers detected. Browser print will be available.');
      }
    } catch (error) {
      setStatus('Error detecting printers: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToPrinter = async (printer) => {
    setIsLoading(true);
    setStatus(`Connecting to ${printer.name}...`);
    
    try {
      await printerService.connectToPrinter(printer);
      setSelectedPrinter(printer);
      setStatus(`Connected to ${printer.name}`);
    } catch (error) {
      setStatus(`Connection failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPrint = async () => {
    if (!selectedPrinter) {
      setStatus('Please select a printer first');
      return;
    }

    setIsLoading(true);
    setStatus('Printing test bill...');
    
    try {
      const testBill = {
        hotelName: 'TEST HOTEL',
        hotelAddress: 'Test Address',
        hotelContact: '123-456-7890',
        billNumber: 'TEST-001',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        customername: 'Test Customer',
        tableNumber: 'TEST-01',
        items: [
          { name: 'Test Item 1', quantity: 1, price: '₹10.00', total: '₹10.00' },
          { name: 'Test Item 2', quantity: 2, price: '₹5.00', total: '₹10.00' }
        ],
        subtotal: '₹20.00',
        tax: '₹1.80',
        taxRate: '9',
        grandTotal: '₹21.80',
        paymentMethod: 'CASH'
      };

      await printerService.printBill(testBill);
      setStatus('Test print successful!');
    } catch (error) {
      setStatus(`Test print failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPrinterIcon = (type) => {
    switch (type) {
      case 'bluetooth': return '📱';
      case 'usb': return '🔌';
      case 'system': return '💻';
      case 'browser': return '🌐';
      default: return '🖨️';
    }
  };

  const getConnectionStatus = (printer) => {
    if (printer.connected) return '🟢 Connected';
    if (printer === selectedPrinter) return '🟡 Selected';
    return '⚪ Available';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Printer Configuration</h2>
      
      {/* Status Display */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Status</h3>
            <p className="text-sm text-gray-600">{status}</p>
          </div>
          <button
            onClick={detectPrinters}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            🔄 Scan
          </button>
        </div>
      </div>

      {/* Available Printers */}
      <div className="space-y-3 mb-6">
        <h3 className="font-semibold text-gray-800">Available Printers</h3>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Scanning for printers...</p>
          </div>
        ) : availablePrinters.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No printers detected. Browser print will be available.
          </div>
        ) : (
          availablePrinters.map((printer) => (
            <div
              key={printer.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedPrinter?.id === printer.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedPrinter(printer)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getPrinterIcon(printer.type)}</span>
                  <div>
                    <div className="font-medium">{printer.name}</div>
                    <div className="text-sm text-gray-600">{printer.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{getConnectionStatus(printer)}</div>
                  {!printer.connected && selectedPrinter?.id === printer.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        connectToPrinter(printer);
                      }}
                      className="mt-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={testPrint}
          disabled={!selectedPrinter || isLoading}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Printing...' : 'Test Print'}
        </button>
        
        <button
          onClick={detectPrinters}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
        >
          Rescan
        </button>
      </div>

      {/* Printer Information */}
      <div className="mt-6 bg-blue-50 rounded-md p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Printer Support Information</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Thermal Printers:</strong> Epson, Star, Citizen (Bluetooth/USB)</li>
          <li>• <strong>System Printers:</strong> Canon, HP, Epson, any Windows/Mac printer</li>
          <li>• <strong>Browser Print:</strong> Works with any printer connected to your system</li>
          <li>• <strong>Auto-detection:</strong> System will automatically find the best available printer</li>
        </ul>
      </div>
    </div>
  );
};

export default PrinterConfig;