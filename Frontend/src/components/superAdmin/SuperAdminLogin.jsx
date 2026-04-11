import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth(); 


    const handleLogin = async () => {
        try {
            console.log(password,email)
            if (password && email) {
                if (password === `${import.meta.env.VITE_SUPERADMIN_PASS}` && email === `${import.meta.env.VITE_SUPERADMIN_EMAIL}`) {
                    console.log("matched")
                    login({
                        role: "superAdmin",
                        name: "Super Admin",
                    });
                    navigate(`/superadmin`);
                }
            }
        } catch (err) {
            alert('Invalid credentials or login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 px-4">
            <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Super Admin Login</h2>

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            <FontAwesomeIcon 
                                icon={showPassword ? faEyeSlash : faEye} 
                                className="h-5 w-5"
                            />
                        </button>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-indigo-600 transition-colors duration-200"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLogin;
