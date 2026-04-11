import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddStaffForm = ({ hotelId }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });

  const [editForm, setEditForm] = useState(null); // store staff being edited
  const [staffList, setStaffList] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/staff/${hotelId}`
      );
      setStaffList(res.data);
    } catch (err) {
      console.error("Error fetching staff", err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [hotelId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/staff/register`,
        {
          ...form,
          hotelId: parseInt(hotelId),
        }
      );

      setShowPopup(true);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "staff",
      });

      fetchStaff();
    } catch (err) {
      console.error("Error adding staff", err);
      alert("Failed to add staff");
    }
  };

  // DELETE staff
  const deleteStaff = async (id) => {
    if (!confirm("Are you sure you want to delete this staff?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/staff/delete/${id}`
      );
      fetchStaff();
    } catch (err) {
      console.error("Error deleting staff", err);
      alert("Failed to delete staff");
    }
  };

  // Open edit popup
  const openEditPopup = (staff) => {
    setEditForm(staff);
    setShowEditPopup(true);
  };

  // Submit edit form
  const updateStaff = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/staff/${editForm.id}`,
        editForm
      );

      setShowEditPopup(false);
      fetchStaff();
    } catch (err) {
      console.error("Error updating staff", err);
      alert("Failed to update staff");
    }
  };

  return (
    <div className="space-y-6 relative">

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300 transition"
      >
        ⬅ Back
      </button>

      {/* ADD STAFF FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow space-y-4"
      >
        <h2 className="text-2xl font-semibold">➕ Add New Staff</h2>

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded"
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          type="email"
          required
          className="w-full px-3 py-2 border rounded"
        />

        <input
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          type="password"
          required
          className="w-full px-3 py-2 border rounded"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="staff">Staff</option>
        </select>

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
        >
          Add Staff
        </button>
      </form>

      {/* STAFF LIST */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold mb-4">👥 Staff Members</h3>

        {staffList.length === 0 ? (
          <p>No staff members added yet.</p>
        ) : (
          <ul className="space-y-4">
            {staffList.map((staff) => (
              <li key={staff.id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <p><strong>Name:</strong> {staff.name}</p>
                  <p><strong>Email:</strong> {staff.email}</p>
                  <p><strong>Role:</strong> {staff.role}</p>
                </div>

                {/* EDIT / DELETE BUTTONS */}
                <div className="space-x-2">
                  <button
                    onClick={() => openEditPopup(staff)}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
        
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteStaff(staff.id)}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
        
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SUCCESS POPUP */}
      {showPopup && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4 text-green-600">
              Staff Added Successfully
            </h2>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* EDIT POPUP */}
      {showEditPopup && editForm && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full space-y-3">
            <h2 className="text-xl font-semibold text-blue-600">✏ Edit Staff</h2>

            <input
              name="name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />

            <input
              name="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />

            <select
              value={editForm.role}
              onChange={(e) =>
                setEditForm({ ...editForm, role: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>

            <div className="flex justify-between pt-3">
              <button
                onClick={() => setShowEditPopup(false)}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>

              <button
                onClick={updateStaff}
                className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStaffForm;
