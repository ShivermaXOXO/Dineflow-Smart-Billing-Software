class PrinterService {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.printerType = null;
    this.availablePrinters = [];
    this.selectedPrinter = null;
    this.isConnected = false;
    this.connectedPrinter = null;
    this.isConnecting = false;
  }

  // Streamlined printer connection
  async connectPrinter() {
    try {
      if (this.isConnecting) {
        throw new Error('Connection already in progress');
      }
      
      this.isConnecting = true;
      console.log("🖨️ Starting printer connection...");

      // Direct Bluetooth device selection
      if (navigator.bluetooth) {
        return await this.connectBluetoothDirect();
      } else {
        throw new Error('Bluetooth not supported in this browser');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  // NEW: Disconnect printer method
  async disconnectPrinter() {
    try {
      console.log("🔌 Disconnecting printer...");
      
      if (!this.isConnected) {
        console.log("ℹ️ No printer connected");
        return { success: true, message: 'No printer was connected' };
      }

      // Disconnect Bluetooth device
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        await this.device.gatt.disconnect();
        console.log("✅ Bluetooth device disconnected");
      }

      // Reset all connection states
      this.device = null;
      this.characteristic = null;
      this.printerType = null;
      this.selectedPrinter = null;
      this.isConnected = false;
      this.connectedPrinter = null;
      this.isConnecting = false;

      console.log("✅ Printer disconnected successfully");
      return { success: true, message: 'Printer disconnected successfully' };
      
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
      
      // Force reset even if disconnect fails
      this.device = null;
      this.characteristic = null;
      this.printerType = null;
      this.selectedPrinter = null;
      this.isConnected = false;
      this.connectedPrinter = null;
      this.isConnecting = false;
      
      return { success: true, message: 'Printer disconnected (forced)' };
    }
  }

  // Direct Bluetooth connection without intermediate steps
  async connectBluetoothDirect() {
    try {
      console.log("🔍 Requesting Bluetooth device directly...");
      
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'DPP' },
          { namePrefix: 'BT' },
          { namePrefix: 'POS' },
          { namePrefix: 'Printer' },
          { namePrefix: 'PT' },
          { namePrefix: 'TP-' },
          { namePrefix: 'TM-' },
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '00001101-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
        ]
      });

      if (!device) {
        throw new Error('No device selected');
      }

      console.log(`✅ Selected device: ${device.name}`);
      
      // Create printer object
      const printer = {
        id: device.id,
        name: device.name || 'Bluetooth Printer',
        type: 'bluetooth',
        connected: false,
        device: device,
        description: 'Bluetooth thermal printer',
        isReal: true
      };

      // Connect immediately
      await this.connectBluetooth(printer);
      
      this.selectedPrinter = printer;
      this.isConnected = true;
      this.connectedPrinter = printer;
      this.isConnecting = false;

      console.log(`✅ Successfully connected to ${printer.name}`);
      return { 
        success: true, 
        message: `Connected to ${printer.name}`,
        printer: printer
      };

    } catch (error) {
      this.isConnecting = false;
      if (error.name === 'NotFoundError') {
        throw new Error('No Bluetooth devices found. Please ensure your printer is turned on and in pairing mode.');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Connection was cancelled. Please try again.');
      } else {
        throw error;
      }
    }
  }

  // Keep your existing connectBluetooth method but remove the device selection part
  async connectBluetooth(printer) {
    let server = null;
    try {
      console.log(`🔗 Starting Bluetooth connection to: ${printer.device.name}`);
      
      if (!printer.device) {
        throw new Error('Bluetooth device not available');
      }

      // Add disconnect listener
      printer.device.addEventListener('gattserverdisconnected', this.handleBluetoothDisconnect.bind(this));

      // Connect to GATT Server
      if (printer.device.gatt && printer.device.gatt.connected) {
        console.log('📱 Device already connected, using existing connection');
        server = printer.device.gatt;
      } else {
        console.log('📡 Connecting to GATT server...');
        server = await printer.device.gatt.connect();
      }

      // Wait for connection stabilization
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('🔍 Looking for printer services...');
      
      // Service discovery (keep your existing service discovery code)
      const serviceUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '00001101-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
      ];

      let service = null;
      let lastError = null;

      for (const serviceUUID of serviceUUIDs) {
        try {
          console.log(`🔧 Trying service: ${serviceUUID}`);
          service = await server.getPrimaryService(serviceUUID);
          console.log(`✅ Found service: ${serviceUUID}`);
          break;
        } catch (error) {
          lastError = error;
          console.log(`❌ Service ${serviceUUID} not available:`, error.message);
          continue;
        }
      }

      if (!service) {
        const services = await server.getPrimaryServices();
        if (services.length > 0) {
          service = services[0];
          console.log(`✅ Using first available service: ${service.uuid}`);
        } else {
          throw new Error(`No supported printer services found. Last error: ${lastError?.message}`);
        }
      }

      // Characteristic discovery (keep your existing characteristic code)
      console.log('🔍 Looking for write characteristic...');
      const characteristics = await service.getCharacteristics();
      console.log(`📋 Found ${characteristics.length} characteristics`);

      characteristics.forEach((char, index) => {
        console.log(`Characteristic ${index}:`, {
          uuid: char.uuid,
          properties: char.properties,
        });
      });

      this.characteristic = characteristics.find(char => 
        char.properties.write || char.properties.writeWithoutResponse
      );

      if (!this.characteristic) {
        if (characteristics.length > 0) {
          this.characteristic = characteristics[0];
          console.log(`⚠️ Using first available characteristic: ${this.characteristic.uuid}`);
        } else {
          throw new Error('No writable characteristics found');
        }
      }

      console.log(`✅ Using characteristic: ${this.characteristic.uuid}`, {
        properties: this.characteristic.properties
      });

      this.device = printer.device;
      this.printerType = 'bluetooth';
      printer.connected = true;

      console.log('✅ Bluetooth printer connected successfully');
      return true;

    } catch (error) {
      console.error('❌ Bluetooth connection failed:', error);
      
      if (server && server.connected) {
        try {
          server.disconnect();
        } catch (e) {
          console.log('Error during disconnect:', e);
        }
      }
      
      printer.connected = false;
      
      if (error.name === 'NetworkError') {
        throw new Error('Bluetooth connection lost. Please ensure the printer is turned on and nearby.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('Printer services not found. The device may not be a compatible thermal printer.');
      } else {
        throw error;
      }
    }
  }

  // Update your UI component to use the new method:
  /*
  async handleConnectPrinter() {
    try {
      // Check if already connected - if so, disconnect
      if (this.state.isConnected) {
        this.setState({ connecting: true });
        const result = await printerService.disconnectPrinter();
        this.setState({ 
          isConnected: false,
          connectedPrinter: null,
          connecting: false 
        });
        toast.success(result.message);
        return;
      }

      // Otherwise, connect
      this.setState({ connecting: true });
      const result = await printerService.connectPrinter();
      
      if (result.success) {
        this.setState({ 
          isConnected: true,
          connectedPrinter: result.printer,
          connecting: false 
        });
        toast.success(result.message);
      }
    } catch (error) {
      this.setState({ connecting: false });
      toast.error(error.message);
    }
  }
  */

  // IMPROVED: Generate thermal printer commands with better alignment
  generatePrintCommands(billData) {
    const commands = [];
    const encoder = new TextEncoder();

    // Helper function to add text
    const addText = (text) => {
      commands.push(encoder.encode(text));
    };

    // Add raw ESC/POS commands
    const addCommand = (bytes) => {
      commands.push(new Uint8Array(bytes));
    };

    // Extract numeric value from formatted strings
    const extractNumericValue = (formattedValue) => {
      if (typeof formattedValue === 'string') {
        const numericString = formattedValue.replace(/[₹,]/g, '').trim();
        return parseFloat(numericString) || 0;
      }
      return formattedValue || 0;
    };

    // Format amount for thermal printer (right aligned)
    const formatAmount = (amount) => {
      const numericValue = extractNumericValue(amount);
      return numericValue.toFixed(2);
    };

    // Truncate text to fit width
    const truncateText = (text, maxLength) => {
      if (text.length > maxLength) {
        return text.substring(0, maxLength);
      }
      return text;
    };

    // Extract numeric values
    const subtotalValue = extractNumericValue(billData.subtotal);
    const taxValue = extractNumericValue(billData.tax);
    const grandTotalValue = extractNumericValue(billData.grandTotal);

    // Printer initialization
    addCommand([0x1B, 0x40]); // Initialize printer
    
    // Set character spacing and line spacing for better alignment
    addCommand([0x1B, 0x20, 0x00]); // Character spacing
    addCommand([0x1B, 0x33, 0x08]); // Line spacing

    // Center align for header
    addCommand([0x1B, 0x61, 0x01]); // Center alignment
    
    // Hotel name (large text)
    addCommand([0x1D, 0x21, 0x11]); // Double height and width
    addText(truncateText(billData.hotelName || 'DineFlow RESTAURANT', 16) + '\n');
    
    // Reset text size
    addCommand([0x1D, 0x21, 0x00]);
    
    // Address (still centered)
    if (billData.hotelAddress) {
      addText(truncateText(billData.hotelAddress, 32) + '\n');
    }
    
    // Reset alignment to left
    addCommand([0x1B, 0x61, 0x00]); // Left alignment
    
    addText('='.repeat(32) + '\n');

    // Bill details
    addText(`Bill #: ${truncateText(billData.billNumber, 24)}\n`);
    addText(`Date: ${billData.date} ${billData.time}\n`);
    addText(`Customer: ${truncateText(billData.customername, 22)}\n`);
    
    if (billData.tableNumber && billData.tableNumber !== 'N/A') {
      addText(`Table: ${billData.tableNumber}\n`);
    }
    
    addText('='.repeat(32) + '\n');

    // Items header - FIXED WIDTH COLUMNS
    // Format: ITEM(18) QTY(4) AMOUNT(8) = 30 chars + 2 spaces = 32
    addText('ITEM              QTY   AMOUNT\n');
    addText('-'.repeat(32) + '\n');

    // Items with proper alignment
    billData.items.forEach(item => {
      // Item name: 18 characters (truncate if longer, pad if shorter)
      const name = truncateText(item.name, 18).padEnd(18, ' ');
      
      // Quantity: 3 characters right-aligned + 1 space = 4 chars total
      const qty = item.quantity.toString().padStart(3, ' ') + ' ';
      
      // Amount: 8 characters right-aligned (format: 9999.99)
      const itemTotal = extractNumericValue(item.total);
      const amount = formatAmount(itemTotal).padStart(8, ' ');
      
      addText(`${name}${qty}${amount}\n`);
    });

    addText('-'.repeat(32) + '\n');

    // Totals with right alignment - keep consistent spacing
    const subtotalLabel = 'Subtotal:';
    const subtotalAmount = formatAmount(subtotalValue);
    const subtotalSpacing = ' '.repeat(32 - subtotalLabel.length - subtotalAmount.length);
    addText(`${subtotalLabel}${subtotalSpacing}${subtotalAmount}\n`);
    
    if (parseFloat(billData.taxRate) > 0) {
      const taxLabel = `Tax (${billData.taxRate}%):`;
      const taxAmount = formatAmount(taxValue);
      const taxSpacing = ' '.repeat(32 - taxLabel.length - taxAmount.length);
      addText(`${taxLabel}${taxSpacing}${taxAmount}\n`);
    }
    
    addText('-'.repeat(32) + '\n');
    
    // Grand total (slightly emphasized with spacing)
    const totalLabel = 'TOTAL:';
    const totalAmount = formatAmount(grandTotalValue);
    const totalSpacing = ' '.repeat(32 - totalLabel.length - totalAmount.length);
    addText(`${totalLabel}${totalSpacing}${totalAmount}\n`);
    
    addText('='.repeat(32) + '\n');
    
    // Payment method
    addText(`Payment: ${billData.paymentMethod}\n`);
    addText('='.repeat(32) + '\n');

    // Thank you message
    addCommand([0x1B, 0x61, 0x01]); // Center alignment
    addText('\n');
    addText('Thank You!\n');
    addText('Visit Again!\n');
    addText('\n');

    // Reset alignment
    addCommand([0x1B, 0x61, 0x00]); // Left alignment

    // Feed paper and cut
    addText('\n\n');
    addCommand([0x1D, 0x56, 0x41, 0x10]); // Partial cut

    return commands;
  }

  // Keep all your existing methods (detectAllPrinters, handleBluetoothDisconnect, etc.)
  // ... (your existing methods remain the same)

  handleBluetoothDisconnect() {
    console.log('📵 Bluetooth printer disconnected');
    this.isConnected = false;
    this.connectedPrinter = null;
    if (this.selectedPrinter) {
      this.selectedPrinter.connected = false;
    }
    
    // Auto-reconnect
    setTimeout(() => {
      if (this.selectedPrinter && this.selectedPrinter.type === 'bluetooth') {
        console.log('🔄 Attempting to reconnect to Bluetooth printer...');
        this.connectToPrinter(this.selectedPrinter).catch(error => {
          console.log('Reconnection failed:', error);
        });
      }
    }, 5000);
  }

  // Your existing printBill, printViaBluetooth, etc. methods remain the same
  async printBill(billData) {
    try {
      if (!this.isConnected || !this.selectedPrinter) {
        console.log('❌ No printer connected for printing');
        return { success: false, message: 'No printer connected' };
      }

      console.log('🖨️ Starting to print bill...', billData);
      
      if (this.printerType === 'bluetooth' && this.characteristic) {
        await this.printViaBluetooth(billData);
      } else if (this.printerType === 'usb' && this.device) {
        await this.printViaUSB(billData);
      } else {
        await this.printViaBrowser(billData);
      }

      console.log('✅ Bill printed successfully');
      return { success: true, message: 'Bill printed successfully' };
    } catch (error) {
      console.error('❌ Print failed:', error);
      return { success: false, message: `Print failed: ${error.message}` };
    }
  }

  async printViaBluetooth(billData) {
    try {
      const commands = this.generatePrintCommands(billData);
      for (const command of commands) {
        if (this.characteristic.properties.write) {
          await this.characteristic.writeValue(command);
        } else if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(command);
        } else {
          throw new Error('Characteristic does not support write operations');
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Bluetooth print error:', error);
      throw error;
    }
  }

  // ... rest of your existing methods
}

export default new PrinterService();