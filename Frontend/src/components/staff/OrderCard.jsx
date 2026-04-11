import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt, faUser, faUtensils } from '@fortawesome/free-solid-svg-icons';

const OrderCard = ({ order, onLoadOrder }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-gray-800 flex items-center">
            <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-600" />
            {order.customername}
          </p>
          <p className="text-sm text-gray-600">Table #{order.tableNumber}</p>
          <p className="text-xs text-gray-500">
            {new Date(order.createdat).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            order.status === 'order_received' 
              ? 'bg-blue-100 text-blue-800'
              : order.status === 'delivered' 
              ? 'bg-green-100 text-green-800'
              : order.status === 'payment'
              ? 'bg-purple-100 text-purple-800'
              : order.status === 'completed'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {order.status === 'order_received' ? 'ORDER RECEIVED' :
             order.status === 'delivered' ? 'DELIVERED' :
             order.status === 'payment' ? 'PAYMENT PENDING' :
             order.status === 'completed' ? 'COMPLETED' :
             order.status.replace('_', ' ').toUpperCase()}
          </span>
          {onLoadOrder && order.status === 'delivered' && (
            <button
              onClick={() => onLoadOrder(order.id)}
              className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors flex items-center"
            >
              <FontAwesomeIcon icon={faReceipt} className="mr-1" />
              Load to Bill
            </button>
          )}
        </div>
      </div>
      
      <div className="border-t pt-3">
        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FontAwesomeIcon icon={faUtensils} className="mr-2 text-gray-500" />
          Items:
        </p>
        <ul className="space-y-1">
          {order.items.map((item, i) => (
            <li key={i} className="text-sm text-gray-600 flex justify-between">
              <span>{item.name}</span>
              <span className="font-medium">× {item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {order.updatedByStaff && (
        <div className="mt-3 pt-2 border-t">
          <p className="text-xs text-green-600 font-medium">✓ Updated by Staff</p>
        </div>
      )}
    </div>
  );
};

export default OrderCard;
