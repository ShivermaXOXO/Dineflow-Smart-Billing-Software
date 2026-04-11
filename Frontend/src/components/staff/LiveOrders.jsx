import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../services/socket';
import OrderCard from './OrderCard';

const LiveOrders = ({ hotelId, onLoadOrder }) => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${hotelId}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching live orders', err);
    }
  };

  useEffect(() => {
    if (!hotelId) return;
    fetchOrders();

    // Connect and join hotel room
    socket.connect();
    socket.emit('joinHotelRoom', hotelId);

    socket.on('newCustomerOrder', (order) => {
      setOrders(prev => [order, ...prev]);
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev =>
        prev.map(order => order.id === updatedOrder.id ? updatedOrder : order)
      );
    });

    socket.on('orderFinalized', (finalizedOrder) => {
      setOrders(prev => prev.filter(order => order.id !== finalizedOrder.id));
    });

    socket.on('orderStatusUpdated', (updatedOrder) => {
      if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
        // Remove completed/cancelled orders from live orders
        setOrders(prev => prev.filter(order => order.id !== updatedOrder.id));
      } else {
        // Update order status for other status changes
        setOrders(prev =>
          prev.map(order => order.id === updatedOrder.id ? updatedOrder : order)
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [hotelId]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📦 Live Customer Orders</h2>

      {orders.length === 0 ? (
        <p>No live orders right now.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map(order => (
            <li key={order.id}>
              <OrderCard order={order} onLoadOrder={onLoadOrder} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LiveOrders;
