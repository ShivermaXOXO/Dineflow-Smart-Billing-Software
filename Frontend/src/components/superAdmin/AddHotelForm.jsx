import React, { useState } from 'react';
import axios from 'axios';


const AddHotelForm = ({ onHotelAdded = () => {} }) => {
  const [form, setForm] = useState({
    name: '',
    address: '',
    email: '',
    password: '',
    profileImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return; // Prevent duplicate submissions
    
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/hotels`, form);
      console.log('Hotel created:', response.data);
      alert('Hotel added successfully');
      onHotelAdded(response.data.id);
      setForm({ name: '', address: '', email: '', password: '', profileImage: '' });
      
      // Call the callback function if provided
      if (onHotelAdded && typeof onHotelAdded === 'function') {
        onHotelAdded(response.data.id);
      }
    } catch (err) {
      console.error('Error adding hotel:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add hotel';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Add Hotel</h2>

      <input
        type="text"
        name="name"
        placeholder="Hotel Name"
        value={form.name}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
        required
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="text"
        name="profileImage"
        placeholder="Profile Image URL"
        value={form.profileImage}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
        required
      />

      <button
        type="submit"
        disabled={isLoading}
        className="bg-black text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Adding Hotel...' : 'Add Hotel'}
      </button>
      
    </form>
  );
};

export default AddHotelForm;
