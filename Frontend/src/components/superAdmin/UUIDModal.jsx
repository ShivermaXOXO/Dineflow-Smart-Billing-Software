import React from "react";

const UUIDModal = ({ id, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-100  p-6 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 w-80 rounded-xl shadow-xl relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-600 hover:text-black text-xl font-bold"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-3 text-center">Hotel Created</h2>

        <p className="font-mono text-center bg-gray-100 p-3 rounded text-lg">
         UUID: {id}
        </p>

        <p className="text-center text-sm mt-3 text-gray-500">
          Save this UUID securely
        </p>
      </div>
    </div>
  );
};

export default UUIDModal;
