import React, { useState } from 'react';
import printerService from '../services/printerService';

const NetworkPrinterConfig = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('9100');
  const [printerName, setPrinterName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addNetworkPrinter = async () => {
    if (!ipAddress) {
      alert('Please enter IP address');
      return;
    }

    setIsAdding(true);
    try {
      const printer = printerService.addNetworkPrinter(
        ipAddress, 
        parseInt(port) || 9100, 
        printerName || `Network Printer (${ipAddress})`
      );
      
      alert(`Network printer ${printer.name} added successfully!`);
      setIpAddress('');
      setPort('9100');
      setPrinterName('');
    } catch (error) {
      alert('Failed to add network printer: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-4">Add Network Printer</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Printer IP Address *
          </label>
          <input
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="192.168.1.100"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Port
          </label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Printer Name (Optional)
          </label>
          <input
            type="text"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="Kitchen Printer"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={addNetworkPrinter}
          disabled={isAdding || !ipAddress}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {isAdding ? 'Adding...' : 'Add Network Printer'}
        </button>

        <div className="bg-yellow-50 p-3 rounded-md">
          <h4 className="font-medium text-yellow-800 mb-1">Network Printer Setup</h4>
          <p className="text-sm text-yellow-700">
            For network thermal printers, ensure the printer is connected to the same network 
            and note its IP address. Most thermal printers use port 9100.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkPrinterConfig;