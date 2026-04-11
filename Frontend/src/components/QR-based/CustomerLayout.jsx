import React, { useState } from "react";
import { Outlet, useParams } from "react-router-dom";

const CustomerLayout = () => {
  const { hotelId, tableNumber } = useParams();
  const [activeTab, setActiveTab] = useState("menu");
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Top Bar */}
      <div className="bg-white shadow px-4 py-3 sticky top-0 z-50 flex gap-4 mt-3">
        <div className="flex items-center justify-between w-full">
          {/* Left */}
          <h1 className="font-bold text-lg">Table - {tableNumber}</h1>
           {["menu", "orders"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setOpenMenu(false);
              }}
              className={`px-3 py-1 text-sm rounded-md border
                ${
                  activeTab === tab
                    ? "bg-blue-600 text-white border-black"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
          {/* Right Hamburger */}
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="text-2xl"
          >
            ☰
          </button>
        </div>

        {/* 🔽 Hamburger Dropdown (Mobile) */}
        {openMenu && (
          <div className="absolute right-4 top-14 bg-white shadow rounded-md w-40 flex flex-col md:hidden">
            {["menu", "orders"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setOpenMenu(false);
                }}
                className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  activeTab === tab ? "font-semibold" : ""
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Screen */}
      <div className="p-4">
        <Outlet
          context={{
            hotelId,
            tableNumber,
            activeTab,
            setActiveTab,
          }}
        />
      </div>
    </div>
  );
};

export default CustomerLayout;
