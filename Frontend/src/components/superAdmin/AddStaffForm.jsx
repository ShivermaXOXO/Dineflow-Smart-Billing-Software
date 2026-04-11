import React, { useState } from 'react';
import axios from 'axios';

const AddStaffForm = ({ hotelId, onStaffAdded }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/staff/register`, {
        ...form,
        hotelId: parseInt(hotelId)
      });
      console.log("hotelId:", hotelId);
      alert('✅ Staff registered successfully');
      setForm({ name: '', email: '', password: '', role: 'staff' });
      if (onStaffAdded) onStaffAdded();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to register staff');
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg p-6 shadow space-y-4"
    >
      <h2 className="text-xl font-bold text-gray-700 mb-2">➕ Add Staff to Hotel #{hotelId}</h2>
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        className="w-full px-4 py-2 border rounded"
        required
      />
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full px-4 py-2 border rounded"
        required
      />
      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Password"
        className="w-full px-4 py-2 border rounded"
        required
      />
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded"
      >
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
        <option value="counter">Counter</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors duration-200"
      >
        {loading ? 'Registering...' : 'Add Staff'}
      </button>
    </form>
  );
};

export default AddStaffForm;
