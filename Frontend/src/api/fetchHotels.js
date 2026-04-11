import axios from 'axios'

// Fetch all hotels (for super admin)
export const fetchAllHotels = async() => {
    try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/hotels`);
        return res.data;
    }
    catch (err) {
        console.log("There is Error", err);
    }
}

// Fetch only active hotels (for homepage)
export const fetchHotels = async() => {
    try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/active`);
        return res.data;
    }
    catch (err) {
        console.log("There is Error", err);
    }
}

// Toggle hotel status
export const toggleHotelStatus = async(hotelId) => {
    try {
        const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/${hotelId}/toggle-status`);
        return res.data;
    }
    catch (err) {
        console.log("There is Error", err);
        throw err;
    }
}

