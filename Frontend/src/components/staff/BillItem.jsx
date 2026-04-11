import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faTrash, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const BillItem = ({ item, onRemoveItem, onUpdateQuantity }) => {
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    } else {
      onRemoveItem(item.id);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faTag} className="text-gray-400 text-xs" />
            <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
          </div>
          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
            <span>₹{item.price} each</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg">
            <button
              onClick={handleDecrease}
              className="p-1 hover:bg-gray-200 rounded-l-lg transition-colors"
              title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
            >
              <FontAwesomeIcon 
                icon={item.quantity === 1 ? faTrash : faMinus} 
                className={`text-xs ${item.quantity === 1 ? 'text-red-500' : 'text-gray-600'}`} 
              />
            </button>
            <span className="px-2 py-1 text-sm font-medium text-gray-700 min-w-[24px] text-center">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrease}
              className="p-1 hover:bg-gray-200 rounded-r-lg transition-colors"
              title="Increase quantity"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs text-gray-600" />
            </button>
          </div>
          
          {/* Total Price */}
          <div className="text-right ml-2">
            <div className="font-semibold text-indigo-600">
              ₹{(item.price * item.quantity).toLocaleString()}
            </div>
          </div>
          
          {/* Delete Button */}
          <button
            onClick={() => onRemoveItem(item.id)}
            className="p-1 ml-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Remove item completely"
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillItem;
