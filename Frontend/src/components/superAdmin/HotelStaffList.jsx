import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HotelStaffList = ({ hotelId }) => {
  const [staff, setStaff] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', role: '', password: '' });

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/staff/${hotelId}`);
      setStaff(res.data);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    }
  };

  useEffect(() => {
    if (hotelId) fetchStaff();
  }, [hotelId]);

  const handleEditClick = (staffMember) => {
    setEditingId(staffMember.id);
    setEditData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      password: '' // intentionally left blank
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({ name: '', email: '', role: '', password: '' });
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async (id) => {
    try {
      // Only include password if it's not blank
      const dataToSend = { ...editData };
      if (!dataToSend.password) delete dataToSend.password;

      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/staff/${id}`, dataToSend);
      await fetchStaff();
      handleCancel();
    } catch (err) {
      console.error('Failed to update staff', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">👥 Staff for Hotel #{hotelId}</h2>

      {staff.length === 0 ? (
        <p className="text-gray-600">No staff members found.</p>
      ) : (
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left text-gray-700">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Password</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                {editingId === s.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        name="role"
                        value={editData.role}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="password"
                        name="password"
                        value={editData.password}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Leave blank to keep"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleSave(s.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-300 text-black px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.email}</td>
                    <td className="px-4 py-2 capitalize">{s.role}</td>
                    <td className="px-4 py-2 text-gray-400 italic">••••••</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleEditClick(s)}
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HotelStaffList;
