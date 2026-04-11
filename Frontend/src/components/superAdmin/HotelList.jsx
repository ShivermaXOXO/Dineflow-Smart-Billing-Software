import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toggleHotelStatus } from '../../api/fetchHotels';
import AddHotelForm from './AddHotelForm';

const HotelList = ({ hotels, refreshHotels }) => {
    const navigate = useNavigate();
    const [editingHotel, setEditingHotel] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        address: '',
        profileImage: '',
        email: ''
    });

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this hotel?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/${id}`);
                refreshHotels();
            } catch (err) {
                console.error('Delete failed', err);
            }
        }
    };

    const handleToggleStatus = async (hotelId, currentStatus) => {
        const action = currentStatus === 'allowed' ? 'restrict' : 'allow';
        if (confirm(`Are you sure you want to ${action} this hotel's login access?`)) {
            try {
                await toggleHotelStatus(hotelId);
                refreshHotels();
            } catch (err) {
                console.error('Toggle status failed', err);
                alert('Failed to update hotel status');
            }
        }
    };

    const handleEditClick = (hotel) => {
        setEditingHotel(hotel.id);
        setEditFormData({
            name: hotel.name,
            address: hotel.address || '',
            profileImage: hotel.profileImage || '',
            email: hotel.email
        });
    };

    const handleEditCancel = () => {
        setEditingHotel(null);
        setEditFormData({
            name: '',
            address: '',
            profileImage: '',
            email: ''
        });
    };

    const handleEditSave = async (hotelId) => {
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/${hotelId}`, editFormData);
            alert('Hotel updated successfully!');
            refreshHotels();
            handleEditCancel();
        } catch (err) {
            console.error('Update failed', err);
            alert('Failed to update hotel');
        }
    };

    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-1">Hotels</h2>
            <h6 className='text-sm'>
                <button
                    onClick={() => navigate('/superadmin/add-hotel')}
                    className="text-blue-600 hover:underline"
                >
                    Add hotel
                </button>
            </h6>
            <ul className="space-y-6 mt-6">
                {hotels.map((hotel) => (
                    <li key={hotel.id} className="border-b pb-4">
                        {editingHotel === hotel.id ? (
                            // Edit Form
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-4">Edit Hotel</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Hotel Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editFormData.name}
                                            onChange={handleEditChange}
                                            className="w-full border px-3 py-2 rounded"
                                            placeholder="Hotel Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={editFormData.address}
                                            onChange={handleEditChange}
                                            className="w-full border px-3 py-2 rounded"
                                            placeholder="Address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Logo URL</label>
                                        <input
                                            type="text"
                                            name="profileImage"
                                            value={editFormData.profileImage}
                                            onChange={handleEditChange}
                                            className="w-full border px-3 py-2 rounded"
                                            placeholder="Profile Image URL"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={editFormData.email}
                                            onChange={handleEditChange}
                                            className="w-full border px-3 py-2 rounded"
                                            placeholder="Email"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleEditSave(hotel.id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleEditCancel}
                                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Display View
                            <>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-medium">{hotel.name} - {hotel.id}</p>
                                           
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                hotel.status === 'allowed' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {hotel.status === 'allowed' ? 'Visible' : 'Hidden'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{hotel.address}</p>
                                    </div>
     <div
  className="
    flex flex-wrap gap-2 mt-3 ml-3
    max-[400px]:flex-col max-[400px]:items-start
  "
>
                                        <button
                                            onClick={() => handleEditClick(hotel)}
                                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-3 py-1 rounded bg-blue-50 hover:bg-blue-100"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(hotel.id, hotel.status)}
                                            className={`font-semibold text-sm px-3 py-1 rounded ${
                                                hotel.status === 'allowed'
                                                    ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100'
                                                    : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                                            }`}
                                        >
                                            {hotel.status === 'allowed' ? 'Restrict' : 'Allow'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(hotel.id)}
                                            className="text-red-600 hover:text-red-800 font-semibold"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => navigate(`/superadmin/staff/${hotel.id}`)}
                                        className="bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded text-blue-800 text-sm font-medium"
                                    >
                                        Staff
                                    </button>
                                    <button
                                        onClick={() => navigate(`/superadmin/orders/${hotel.id}`)}
                                        className="bg-green-100 hover:bg-green-200 px-3 py-1 rounded text-green-800 text-sm font-medium"
                                    >
                                        Orders
                                    </button>
                                    <button
                                        onClick={() => navigate(`/superadmin/add-staff/${hotel.id}`)}
                                        className="bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded text-purple-800 text-sm font-medium"
                                    >
                                        Add Staff
                                    </button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HotelList;
