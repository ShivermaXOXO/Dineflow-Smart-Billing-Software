import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { faUser, faBars, faTimes, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Navbar = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => setShowLogoutConfirm(true);

    const handleLogoutConfirm = () => {
        logout();
        setShowLogoutConfirm(false);
        setMenuOpen(false);
        navigate('/', { replace: true });
    };

    const handleStayLoggedIn = () => setShowLogoutConfirm(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);

    const renderLinks = () => {
        if (auth?.role === 'superadmin') {
            return (
                <Link to="/superadmin" className="block px-4 py-2 text-sm font-medium hover:text-gold transition">
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Super Admin
                </Link>
            );
        } else if (auth?.role === 'admin') {
            return (
                <Link to={`/admin/${auth.hotelId}`} className="block px-4 py-2 text-sm font-medium hover:text-gold transition">
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Admin Dashboard
                </Link>
            );
        } else if (auth?.role === 'staff') {
            return (
                <Link to={`/staff/${auth.hotelId}`} className="block px-4 py-2 text-sm font-medium hover:text-gold transition">
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Staff Dashboard
                </Link>
            );
        } else if (auth?.role === 'counter') {
            return (
                <Link to={`/counter/${auth.hotelId}`} className="block px-4 py-2 text-sm font-medium hover:text-gold transition">
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Counter Dashboard
                </Link>
            );
        }
            
        return (
            <Link to="/" className="block px-4 py-2 text-sm font-medium hover:text-gold transition">
                Home
            </Link>
        );
    };

    return (
        <>
            <nav className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-500 px-6 py-3 shadow-md">
                <div className="flex justify-between items-center">

                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="h-16 w-32 flex items-center">
                            <img
                                src="/logo1-removebg-preview.png"
                                alt="DineFlow Logo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Menu */}
                    <div className="hidden md:flex items-center space-x-6 text-white ml-auto">
                        {renderLinks()}

                        {!auth?.token ? (
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition font-semibold"
                            >
                                Login
                            </button>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="text-sm px-4 py-2 bg-black/30 text-white rounded-md hover:bg-black/40 transition"
                            >
                                Logout
                            </button>
                        )}
                    </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={toggleMenu}>
                        <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} className="text-xl text-gray-800" />
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {menuOpen && (
                <div className="md:hidden mt-2 border-t border-gray-200 pt-2">
                    {renderLinks()}

                    {!auth?.token ? (
                        <button
                            onClick={() => { setMenuOpen(false); navigate('/login'); }}
                            className="w-full text-left px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition mt-2"
                       >
                            Login
                        </button>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition mt-2"
                        >
                            Logout
                        </button>
                    )}
                </div>
            )}
        </nav>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                    <div className="flex items-center mb-4">
                        <FontAwesomeIcon icon={faWarning} className="text-yellow-500 text-xl mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to logout?
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleStayLoggedIn}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                            Stay Logged In
                        </button>
                        <button
                            onClick={handleLogoutConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
    );
};

export default Navbar;
