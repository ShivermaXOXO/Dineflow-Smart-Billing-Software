import React from 'react';
import { useNavigate } from 'react-router-dom';
const CafeCard = ({ name, address,  profileImage, id}) => {
    const navigate = useNavigate()
    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-300">
            <div className="relative">
                <div className="h-36 bg-gray-400"></div>
                <img
                    src={profileImage}
                    alt="Cafe Logo"
                    className="w-20 h-20 rounded-full border-4 border-white absolute top-20 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-md bg-white"
                />
            </div>

            <div className="pt-12 pb-6 px-6 text-center">
                <h3 className="text-2xl font-semibold text-black mb-1">{name}</h3>
                <p className="text-gray-700 mb-1">{address}</p>

                <div className="mt-5">
                    <a
                        className="inline-block bg-black text-white font-semibold py-2 px-5 rounded-full hover:bg-gray-800 transition"
                        onClick={() => navigate(`/login/${id}`)}
                    >
                        Login
                    </a>
                </div>
            </div>
        </div>
    );
};

export default CafeCard;
