import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faMinus, 
  faTimes, 
  faUser, 
  faUtensils,
  faStickyNote,
  faTable,
  faCar,
  faShoppingCart,
  faSearch,
  faArrowRight,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import DisplayKot from '../counter/DisplayKot';
import { useAuth } from '../../context/authContext.jsx';

const NewOrderDialog = ({ 
  isOpen, 
  onClose, 
  hotelId, 
  staffId, 
  onOrderCreated, 
  editingOrder = null, 
  role, 
  onKOTSave, 
  onPrintKOT, 
  printSingleKOT, 
  handlePrintBill,
  onOrderUpdated, 
  handleCounterCreateOrder, 
  onCreateOrder,
  savedKOTs = [], 
  onDeleteKot,
  initialTableNumber,
  initialDiningType  ,
  forceDiningType = null  ,
  forceTakeawayMode = false,
  prefillData = null
}) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const isEditing = Boolean(editingOrder);
  const isTableOrder = Boolean(initialTableNumber);
  const hasInitialized = useRef(false);
  const { auth } = useAuth();
  
  const [customerInfo, setCustomerInfo] = useState({
    isLoyal: false,
    visits: 0
  });

  // Default empty order data
  const getDefaultOrderData = () => ({
    customername: '',
    phoneNumber: '',
    tableNumber: '',
    diningType: forceDiningType || '',
    carDetails: '',
    notes: ''
  });

  const [orderData, setOrderData] = useState(getDefaultOrderData());

  // Reset everything when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log("📝 Dialog opened with:", {
        isEditing,
        initialTableNumber,
        initialDiningType,
        isTableOrder
      });
      
      // Always reset to default first
      const defaultData = getDefaultOrderData();
      
      if (isEditing && editingOrder) {
        // Editing existing order
        setOrderData({
          customername: editingOrder.customername || '',
          phoneNumber: editingOrder.phoneNumber || '',
          tableNumber: editingOrder.tableNumber || '',
          diningType: editingOrder.diningType || '',
          carDetails: editingOrder.carDetails || '',
          notes: editingOrder.notes || ''
        });
        
        // Populate items for editing
        if (editingOrder.items && Array.isArray(editingOrder.items)) {
          setSelectedItems(editingOrder.items.map(item => ({
            productId: item.productId,
            name: item.name || item.productName,
            price: parseFloat(item.price),
            quantity: item.quantity
          })));
        } else {
          setSelectedItems([]);
        }
      } else if (prefillData) {
        setOrderData({
          ...defaultData,
          customername: prefillData.customername || '',
          phoneNumber: prefillData.phoneNumber || '',
          diningType: 'takeaway',
          carDetails: prefillData.carDetails || '',
          orderId: prefillData.orderId
        });
        setSelectedItems([]); 
      } else if (initialTableNumber) {
        // New order from table click
        console.log("🔄 Setting up new order for table:", initialTableNumber);
        setOrderData({
          ...defaultData,
          tableNumber: initialTableNumber.toString(),
          diningType: initialDiningType || 'dine-in'
        });
        setSelectedItems([]);
      } else {
        // Regular new order (from New Order button)
        console.log("🔄 Setting up regular new order");
        setOrderData(defaultData);
        setSelectedItems([]);
      }
      
      // Reset search and filters
      setSearchTerm('');
      setSelectedCategory('');
      setCustomerInfo({ isLoyal: false, visits: 0 });
      
      hasInitialized.current = true;
    } else {
      // Dialog closed, reset everything
      setOrderData(getDefaultOrderData());
      setSelectedItems([]);
      setSearchTerm('');
      setSelectedCategory('');
      setCustomerInfo({ isLoyal: false, visits: 0 });
      hasInitialized.current = false;
      setCurrentStep(1);
    }
  }, [isOpen, editingOrder, initialTableNumber, initialDiningType, prefillData]);

  // Check customer loyalty
  useEffect(() => {
    const checkCustomer = async () => {
      if (orderData.phoneNumber.length < 10) {
        setCustomerInfo({ isLoyal: false, visits: 0 });
        return;
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/check`,
          {
            params: {
              phone: orderData.phoneNumber,
              hotelId
            }
          }
        );
        console.log("Customer check response:", res.data);
        setCustomerInfo(res.data);
      } catch (err) {
        console.error("Customer check failed", err);
      }
    };

    checkCustomer();
  }, [orderData.phoneNumber, hotelId]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/${hotelId}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to fetch products');
      }
    };

    if (isOpen && hotelId) {
      fetchProducts();
    }
  }, [isOpen, hotelId]);


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(products.map(product => product.type))];

  // Add item to order
  const addItem = (product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems(prev => [...prev, {
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1
      }]);
    }
  };

  // Remove item from order
  const removeItem = (productId) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setSelectedItems(prev => 
      prev.map(item => 
        item.productId === productId 
          ? { ...item, quantity: quantity }
          : item
      )
    );
  };

  // Calculate total
  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  // Submit order
  const submitOrder = async () => {
    if (!orderData.diningType) {
      toast.error('Please select dining type');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    try {
      setLoading(true);
      
      const orderPayload = {
        ...orderData,
        customername: orderData.customername.trim() || 'Walk-in Customer',
        items: selectedItems.map(item => ({
          productId: item.productId,
          name: item.name,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total,
        hotelId: hotelId,
        staffId: staffId
      };

      let response;
      if (isEditing) {
        response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${editingOrder.id}`, orderPayload);
        toast.success('Order updated successfully');
        if (onOrderUpdated) {
          onOrderUpdated(response.data.order);
        }
      } else {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/orders`, orderPayload);
        toast.success('Order created successfully');
        if (onOrderCreated) {
          onOrderCreated(response.data.order);
        }
      }

      // Reset and close
      handleClose();
      
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} order:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} order`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveKOT = () => {
    if (selectedItems.length === 0) {
      toast.error('No items to save in KOT');
      return;
    }
    
    if (
      role === "counter" &&
      orderData.diningType === "dine-in" &&
      !orderData.tableNumber || orderData.diningType === ''
    ) {
      toast.error("Table number is required for dine-in orders");
      return;
    }
    
    console.log('===================Saving KOT with items:', hotelId);
    const kotObject = {
      kotId: `KOT-${Date.now()}`,
      hotelId: hotelId,
      diningType: orderData.diningType,
      tableNumber: orderData.tableNumber || null,
      customername: orderData.customername || 'Walk-in Customer',
      phoneNumber: orderData.phoneNumber || '',
      carDetails: orderData.carDetails || '',
      notes: orderData.notes || '',
      createdAt: new Date().toISOString(),
      status: 'pending',
      items: selectedItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    if (onKOTSave) onKOTSave(kotObject);
    setSelectedItems([]);
    toast.success('KOT saved successfully', { position: "top-center", autoClose: 1000 });
  };

  // Close handler - properly resets everything
  const handleClose = () => {
    // Reset all state
    setOrderData(getDefaultOrderData());
    setSelectedItems([]);
    setSearchTerm('');
    setSelectedCategory('');
    setCustomerInfo({ isLoyal: false, visits: 0 });
    setCurrentStep(1);
    // Close the dialog
    if (onClose) {
      onClose();
    }
  };
  const renderActionButtons = () => (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={handleSaveKOT}
        className="py-2 bg-gray-600 text-white rounded text-sm font-medium"
      >
        Save KOT
      </button>

      <button
        onClick={() => {
          const isTakeaway = forceTakeawayMode || orderData.diningType === 'takeaway';

          if (role === 'counter' && handleCounterCreateOrder) {

            handleCounterCreateOrder(
              isTakeaway ? null : (orderData.tableNumber || initialTableNumber),
              isTakeaway,
              orderData.orderId
            );
          } else if (onCreateOrder) {
            onCreateOrder(
              isTakeaway ? null : (orderData.tableNumber || initialTableNumber),
              isTakeaway,
              prefillData?.orderId
            );
          } else {
            console.error("No Create Order function found");
          }
        }}
        className="py-2 bg-green-600 text-white rounded text-sm font-medium"
      >
        Create Order
      </button>
    </div>
  );
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 transition-opacity duration-300">
      <div className="bg-white w-full h-full flex flex-col lg:max-w-[90vw] xl:max-w-[85vw] 2xl:max-w-[80vw] lg:h-[90vh] lg:rounded-lg lg:m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b bg-white shadow-sm lg:rounded-t-lg ">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FontAwesomeIcon icon={faShoppingCart} className="text-lg sm:text-2xl text-indigo-600" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
              {forceDiningType === 'takeaway' ? '🥡 Takeaway Order' : isEditing ? 'Update Order' : 'Create New Order'}
              {initialTableNumber && ` - Table ${initialTableNumber}`}
            </h1>  {forceDiningType === 'takeaway' && 
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Takeaway Mode
              </span>
            }
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 text-lg sm:text-2xl p-2 hover:bg-gray-100 rounded-full"
            >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative h-full">
          <div className={`${currentStep === 1 ? 'flex' : 'hidden'} lg:flex w-full lg:w-2/3 lg:border-r bg-gray-50 flex-col h-full`}>
            {/* Products Section */}
            <div className="p-3 sm:p-4 bg-white border-b flex-shrink-0 z-10 shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                <div className="flex-1 relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                    />
                </div>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)} 
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none bg-white text-sm"
                  >
                  <option value="">All Categories</option>
                  {categories.map(category => 
                    <option key={category} value={category}>{category}</option>
                  )}
                </select>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                <p>Showing {filteredProducts.length} products</p>
                <div className="lg:hidden font-bold text-indigo-600">Cart: {totalItems} (₹{total})</div>
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {filteredProducts.map((product) => {
                  const selectedItem = selectedItems.find(item => item.productId === product.id);
                  const quantity = selectedItem?.quantity || 0;
                  return (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md">
                      {product.imageUrl && 
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-16 object-cover rounded-lg mb-2" 
                          />
                          }
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 text-xs leading-tight line-clamp-2">{product.name}</h3>
                        <p className="text-xs font-bold text-green-600">₹{product.price}</p>
                        {!selectedItem ? (
                          <button 
                            onClick={() => addItem(product)} 
                            className="w-full bg-indigo-600 text-white py-1.5 rounded-lg text-xs font-medium"
                            >
                            <FontAwesomeIcon icon={faPlus} className="mr-1" />Add</button>
                        ) : (
                          <div className="flex justify-between bg-gray-50 rounded-lg p-1">
                            <button onClick={() => updateQuantity(product.id, quantity - 1)} 
                            className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-full">
                            <FontAwesomeIcon icon={faMinus} className="text-xs" /></button>
                            <span className="text-xs font-semibold px-2 pt-1">{quantity}</span>
                            <button onClick={() => updateQuantity(product.id, quantity + 1)} 
                            className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                            <FontAwesomeIcon icon={faPlus} className="text-xs" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MOBILE ONLY */}
            <div className="lg:hidden bg-white border-t p-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex-shrink-0">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={selectedItems.length === 0}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold flex items-center justify-center shadow-md disabled:bg-gray-400"
              >
                <span>Review Order ({totalItems})</span>
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>

          
          <div className={`${currentStep === 2 ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/3 bg-white flex-col border-t lg:border-t-0 h-full`}>

            {/* MOBILE ONLY: Back Button */}
            <div className="lg:hidden p-3 border-b bg-gray-50 flex items-center sticky top-0 z-10 flex-shrink-0">
              <button onClick={() => setCurrentStep(1)} className="text-indigo-600 font-medium text-sm">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Back to Menu
              </button>
              <span className="ml-auto font-bold text-gray-700">Total: ₹{total}</span>
            </div>

            {/* Order Form Header */}
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center">
              <FontAwesomeIcon icon={faUser} 
              className="mr-2 text-gray-600" />
              Order Details
              </h2>
            </div>

            {/* KOT Display */}
            {(role == 'counter' || role == "staff") && (
              <DisplayKot savedKOTs={savedKOTs.filter(k => {
                if (k.orderCreated || k.status === 'completed') return false;
                if (forceTakeawayMode || orderData.diningType === 'takeaway') 
                return k.diningType === 'takeaway';
                if (orderData.tableNumber || initialTableNumber) 
                return k.tableNumber == (orderData.tableNumber || initialTableNumber);
                return true;
              })} 
              hotelId={hotelId} 
              role={role} 
              printSingleKOT={printSingleKOT} 
              onDeleteKOT={onDeleteKot} 
              tableNo={initialTableNumber}
              />
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Selected Items */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">
                Selected Items ({totalItems})
                </h3>
                {selectedItems.length === 0 ? 
                <p className="text-center text-gray-500 py-4 text-sm">No items selected</p>
                 : (
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.productId} className="flex justify-between bg-gray-50 rounded-lg p-2">
                        <div className="flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">₹{item.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} 
                          className="text-red-600">
                          <FontAwesomeIcon icon={faMinus} className="text-xs" />
                          </button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                          className="text-green-600">
                          <FontAwesomeIcon icon={faPlus} className="text-xs" />
                          </button>
                          <button onClick={() => removeItem(item.productId)} 
                          className="text-gray-400 ml-1">
                          <FontAwesomeIcon icon={faTimes} className="text-xs" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div className="space-y-3">
                <input type="text" value={orderData.customername} 
                onChange={(e) => setOrderData(prev => ({ ...prev, customername: e.target.value }))} 
                className="w-full border rounded-lg px-3 py-2 text-sm" 
                placeholder="Customer Name" />
                <input type="tel" 
                value={orderData.phoneNumber} 
                onChange={(e) => setOrderData(prev => ({ ...prev, phoneNumber: e.target.value }))} 
                className="w-full border rounded-lg px-3 py-2 text-sm" 
                placeholder="Phone Number" />

                {/* Dining Type */}
                {!forceDiningType && !initialTableNumber ? (
                  <select value={orderData.diningType} 
                  onChange={(e) => setOrderData(prev => ({ ...prev, 
                  diningType: e.target.value, 
                  tableNumber: e.target.value === 'takeaway' ? '' : prev.tableNumber }))} 
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select dining type</option>
                    <option value="dine-in">Dine-In</option>
                    <option value="takeaway">Takeaway</option>
                  </select>
                ) : (
                    <div className={`border rounded-lg px-3 py-2 text-sm font-medium ${orderData.diningType === 'takeaway' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                      {orderData.diningType === 'takeaway' ? 'Takeaway' : 'Dine-In'} {orderData.tableNumber ? `- Table ${orderData.tableNumber}` : ''}
                  </div>
                )}

                {orderData.diningType === 'dine-in' && !initialTableNumber && (
                  <input type="text" 
                  value={orderData.tableNumber} 
                  onChange={(e) => setOrderData(prev => ({ ...prev, tableNumber: e.target.value }))} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Table Number" />
                )}
                {orderData.diningType === 'takeaway' && (
                  <input type="text" 
                  value={orderData.carDetails} 
                  onChange={(e) => setOrderData(prev => ({ ...prev, carDetails: e.target.value }))} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Car Number" />
                )}
                <textarea 
                value={orderData.notes} 
                onChange={(e) => setOrderData(prev => ({ ...prev, notes: e.target.value }))} 
                className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" 
                placeholder="Notes" />
              </div>
              {auth?.name && (
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faUser} />
                  <span>Staff: {auth.name}</span>
                </div>
              )}

              {/* Total */}
              <div className="bg-indigo-50 rounded-lg p-3 flex justify-between font-bold text-gray-900">
              <span>Total:</span>
              <span className="text-indigo-600">₹{total}
              </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t p-4 bg-gray-50 sticky bottom-0">
              {renderActionButtons()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrderDialog;