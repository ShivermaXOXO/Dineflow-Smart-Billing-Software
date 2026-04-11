import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const MenuItemCard = ({ item, onAdd }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:border-orange-300 min-h-[70px] flex flex-row items-center gap-3">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/150';
          }}
        />
      )}
      <div className="flex-1 flex items-center justify-between min-w-0">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-gray-900 mb-1 text-xs truncate">{item.name}</h3>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm font-bold text-orange-600">₹{item.price}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded-full">
              {item.type}
            </span>
          </div>
        </div>
        
        <button
          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium text-xs whitespace-nowrap flex-shrink-0"
          onClick={() => onAdd(item)}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
