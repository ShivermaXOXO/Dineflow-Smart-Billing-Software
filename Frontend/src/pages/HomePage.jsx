import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const HomePage = () => {
     
  
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const [hotelId, setHotelId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('hotelId'); // 'hotelId' or 'credentials'

  // Reset form when component mounts
  useEffect(() => {
    setEmail('');
    setPassword('');
    setRole('admin');
    setShowPassword(false);
    setIsLoading(false);
    setStep('hotelId');
  }, []);

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

      if (res.data.user.role === 'admin') {
        navigate(`/admin/${res.data.user.hotelId}`);
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
    <>
       
   
       
   
         {/* MAIN CONTENT */}
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 text-gray-800 font-sans">

        <section className="min-h-[80vh] flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-20">

          <div className="max-w-xl text-center md:text-left">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Smart Billing for{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 bg-clip-text text-transparent">
                Modern Restaurants
              </span>
            </h1>

            <p className="text-gray-600 text-lg mb-8">
              Fast billing, real-time insights, and seamless management — all in one platform.
            </p>

            <div className="flex gap-4 justify-center md:justify-start">
              <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg">
                Start Free Trial
              </button>

              <button className="backdrop-blur-lg bg-white/30 border border-white/40 px-6 py-3 rounded-xl font-semibold hover:bg-white/40 transition">
                Watch Demo
              </button>
            </div>
          </div>

          <div className="mt-12 md:mt-0">
            <img
              src="/dashboard.png"
              alt="dashboard"
              className="w-[500px] rounded-2xl shadow-2xl border border-white/30"
            />
          </div>

        </section>

        {/* FEATURES */}
        <section className="py-20 px-6 md:px-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Features That Make Billing Smarter
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              "Realtime Billing Sync",
              "Auto-GST Calculation",
              "Multi-Staff Support",
              "Inventory Alerts",
              "Customer Tracking",
              "Multi-Device Support",
            ].map((title, i) => (
              <div
                key={i}
                className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-2xl p-8 shadow-xl hover:scale-105 hover:bg-white/40 transition-all duration-300"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-green-400 text-white rounded-xl text-2xl mb-5 shadow-md">
                  ⚡
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {title}
                </h3>

                <p className="text-gray-700 text-sm">
                  Powerful feature designed to simplify your restaurant operations.
                </p>
              </div>
            ))}
          </div>
        </section>


        {/* HOW IT WORKS */}
        <section className="py-20 px-6 md:px-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How DineFlow Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {["Sign Up", "Start Billing", "Track Sales"].map((step, i) => (
              <div
                key={i}
                className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-2xl p-8 text-center shadow-xl hover:scale-105 transition"
              >
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 text-4xl font-bold mb-4">
                  {i + 1}
                </div>

                <h3 className="text-lg font-semibold text-gray-900">{step}</h3>

                <p className="text-gray-700 text-sm mt-3">
                  Simple and quick process to get started instantly.
                </p>
              </div>
            ))}
          </div>
        </section>


        {/* PRICING */}
        <section className="py-20 px-6 md:px-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">
            Simple Pricing
          </h2>

          <div className="max-w-md mx-auto backdrop-blur-xl bg-white/30 border border-white/40 rounded-2xl p-10 shadow-2xl">

            <p className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 bg-clip-text text-transparent">
              ₹5000 / Year
            </p>

            <p className="text-gray-700 mb-6">Just ₹17/day</p>

            <ul className="text-left text-gray-800 space-y-3 mb-8">
              <li>✔ Free Installation</li>
              <li>✔ Free Demo</li>
              <li>✔ 24×7 Support</li>
              <li>✔ Unlimited Devices</li>
            </ul>

            <button className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg">
              Get Started
            </button>
          </div>
        </section>


        {/* REFERRAL */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-3xl mx-auto backdrop-blur-xl bg-white/30 border border-white/40 rounded-2xl p-10 shadow-xl">

            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Earn While You Share 🚀
            </h2>

            <p className="text-gray-700 mb-4">
              Refer DineFlow and get rewarded instantly.
            </p>

            <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 bg-clip-text text-transparent">
              Bring 1 client → ₹1000 | Bring 5 → FREE Year 🎉
            </p>

          </div>
        </section>

      </div>
   
        
       </>
  );
};

export default HomePage;