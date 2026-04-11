import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faHotel } from '@fortawesome/free-solid-svg-icons';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  const [hotelId, setHotelId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('hotelId'); // 'hotelId' or 'credentials'
const location = useLocation();
const isQrAdminLogin = location.pathname === "/qradmin-login";
const [role, setRole] = useState(isQrAdminLogin ? "QRadmin" : "admin");

console.log("QR Admin Login:", isQrAdminLogin);
console.log("Selected Role:", role);
  // Reset form when component mounts
  useEffect(() => {
    setEmail('');
    setPassword('');
    setRole(isQrAdminLogin ? 'QRadmin' : 'admin');
    setShowPassword(false);
    setIsLoading(false);
    setStep('hotelId');
  }, [isQrAdminLogin]);

  const handleHotelIdSubmit = async () => {
    if (!hotelId.trim()) {
      alert('Please enter Hotel ID');
      return;
    }

    // Validate if it's a number (since hotelId is integer in database)
    if (isNaN(hotelId)) {
      alert('Please enter a valid numeric Hotel ID');
      return;
    }

    setIsLoading(true);
    try {
      // Check if hotel exists and is not restricted
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/${hotelId}/check`);
      
      if (response.data.exists) {
        if (response.data.status === 'restricted') {
          alert('This hotel account has been restricted. Please contact support.');
          return;
        }
        // Hotel exists and is active, proceed to credentials step
        setStep('credentials');
      } else {
        alert('Hotel ID not found. Please check the ID and try again.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        alert('Hotel ID not found. Please check the ID and try again.');
      } else {
        console.error('Error checking hotel:', err);
        alert('Error verifying Hotel ID. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (isLoading) return;
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/staff/login`, {
        email,
        password,
        role,
        hotelId: parseInt(hotelId), // Convert to integer for backend
      });

      login({
        token: res.data.token,
        role: res.data.user.role,
        name: res.data.user.name,
        userId: res.data.user.id,
        hotelId: res.data.user.hotelId,
      });

      if (isQrAdminLogin) {
  navigate(`/qradmin/${res.data.user.hotelId}`);
} else if (res.data.user.role === 'admin') {
  navigate(`/admin/${res.data.user.hotelId}`);
} else if (res.data.user.role === 'counter') {
  navigate(`/counter/${res.data.user.hotelId}`);
} else {
  navigate(`/staff/${res.data.user.hotelId}`);
}

    } catch (err) {
      if (err.response?.status === 404) {
        if (err.response.data.message === 'Hotel not found') {
          alert('Hotel not found. Please check your Hotel ID.');
          setStep('hotelId');
        } else {
          alert('User not found for this hotel');
        }
      } else if (err.response?.status === 403) {
        alert('This hotel account has been restricted. Please contact support.');
        setStep('hotelId');
      } else if (err.response?.status === 401) {
        alert('Invalid password');
      } else {
        alert('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToHotelId = () => {
    setStep('hotelId');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
          {step === 'hotelId' ? 'Enter Hotel ID' : 'Login to Dashboard'}
        </h2>

        {step === 'hotelId' ? (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <FontAwesomeIcon icon={faHotel} className="h-12 w-12 text-indigo-600 mb-2" />
              <p className="text-gray-600">Enter your Hotel ID to continue</p>
            </div>
            
            <input
              type="text"
              placeholder="Hotel ID"
              value={hotelId}
              onChange={e => setHotelId(e.target.value.replace(/\D/g, ''))} // Only allow numbers
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleHotelIdSubmit()}
            />

            <button
              onClick={handleHotelIdSubmit}
              disabled={isLoading || !hotelId.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Continue to Login'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                Hotel ID: <span className="font-mono text-gray-800">{hotelId}</span>
              </p>
              <button
                onClick={goBackToHotelId}
                className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
              >
                Change Hotel
              </button>
            </div>

        {!isQrAdminLogin && (
  <select
    value={role}
    onChange={e => setRole(e.target.value)}
    disabled={isLoading}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  >
    <option value="admin">Admin</option>
    <option value="staff">Staff</option>
    <option value="counter">Counter</option>
  </select>
)}


            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon 
                  icon={showPassword ? faEyeSlash : faEye} 
                  className="h-5 w-5"
                />
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-indigo-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;