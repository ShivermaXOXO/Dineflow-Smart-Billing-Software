import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { useOutletContext } from "react-router-dom";

const MenuScreen = () => {
  const { hotelId, tableNumber } = useOutletContext();
  const [tableInput, setTableInput] = useState(tableNumber || "");

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
const sessionId = sessionStorage.getItem("orderSession");
console.log("Order session ID:", sessionId);
const saveOrder = async () => {
  if (!tableInput) {
    alert("Please enter table number");
    return;
  }

  const orderData = {
    orderId: `ORD-${Date.now()}`,
    hotelId,
    sessionId,
    tableNumber: tableInput,
    items: cart,
    total: cart.reduce((s, i) => s + i.qty * Number(i.price), 0),
    status: "pending",
  };

  try {
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/qrorders/create`,
      orderData
    );

    alert("Order placed successfully!");
    setCart([]);
    setShowSummary(false);
  } catch (err) {
    console.error("Order save error:", err);
    alert("Failed to place order");
  }
};


  /* ---------------- FETCH PRODUCTS ---------------- */
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/${hotelId}`
      );
      setProducts(res.data);
    };
    fetchProducts();
  }, [hotelId]);

  /* ---------------- CATEGORIES ---------------- */
  const categories = [
    "All",
    ...new Set(products.map((p) => p.type)),
  ];

  /* ---------------- FILTER ---------------- */
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchCategory =
      selectedCategory === "" ||
      selectedCategory === "All" ||
      p.type === selectedCategory;
    return matchSearch && matchCategory;
  });

  /* ---------------- CART LOGIC ---------------- */
  const addItem = (product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeItem = (productId) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === productId ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const getQty = (id) =>
    cart.find((i) => i.id === id)?.qty || 0;

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4 pb-28 sm:pb-32">
      

      {/* 🔍 SEARCH */}
      <div className="relative">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search food..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>

      {/* 🧩 CATEGORIES */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === cat || (cat === "All" && selectedCategory === "")
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🍽️ MENU GRID */}
   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">

        {filteredProducts.map((p) => {
          const qty = getQty(p.id);
          return (
            <div
              key={p.id}
              className="bg-white p-3 rounded-lg shadow"
            >
              {p.imageUrl && (
              <img
  src={p.imageUrl}
  alt={p.name}
  className="h-24 sm:h-28 w-full object-cover rounded mb-2"
/>

              )}
             <h3 className="font-semibold text-sm sm:text-base truncate">
  {p.name}
</h3>
<p className="text-xs sm:text-sm text-gray-500">
  ₹{p.price}
</p>


              {qty === 0 ? (
                <button
                  onClick={() => addItem(p)}
                 className="mt-2 w-full bg-gray-700 hover:bg-gray-800 
text-white py-1.5 rounded-lg text-sm"

                >
                  Add
                </button>
              ) : (
                <div className="flex justify-between items-center mt-2">
                  <button onClick={() => removeItem(p.id)}>
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <span>{qty}</span>
                  <button onClick={() => addItem(p)}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>


{showSummary && (
  <div className="fixed inset-0 bg-black bg-opacity-0 bottom-0 z-50 flex items-end">
    <div className="bg-white w-full bottom-0 rounded-t-2xl p-4  overflow-y-auto">

      <h2 className="text-lg font-bold mb-2">
        Table {tableInput} • Order Summary
      </h2>

      {cart.map(item => (
        <div key={item.id} className="flex justify-between items-center py-2 border-b">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-gray-500">₹{item.price}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => removeItem(item.id)}
              className="px-2 py-1 bg-gray-200 rounded"
            >
              −
            </button>
            <span>{item.qty}</span>
            <button
              onClick={() => addItem(item)}
              className="px-2 py-1 bg-gray-200 rounded"
            >
              +
            </button>
          </div>
        </div>
      ))}

      {/* TOTAL */}
      <div className="flex justify-between font-bold py-3">
        <span>Total</span>
        <span>
          ₹{cart.reduce((s, i) => s + i.qty * Number(i.price), 0)}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setShowSummary(false)}
          className="w-1/2 border rounded py-2"
        >
          Back
        </button>

        <button
          onClick={saveOrder}
          className="w-1/2 bg-gray-700 text-white rounded py-2"
        >
          Place Order
        </button>
      </div>

    </div>
  </div>
)}

      {/* 🛒 CART INFO */}
{cart.length > 0 && (
  <div className="fixed bottom-0 sm:bottom-4 left-0 sm:left-4 right-0 sm:right-4 
bg-gray-700 text-white p-3 sm:rounded-lg 
flex flex-col sm:flex-row gap-2 z-40 items-center justify-between ">

    {/* 🪑 TABLE INPUT (LEFT SIDE) */}
    <input
      type="text"
      placeholder="Enter Table No"
      value={tableInput}
      onChange={(e) => setTableInput(e.target.value)}
     className="w-full sm:w-28 px-2 py-1 rounded bg-white text-black text-sm font-semibold"
    />

    {/* 🛒 CART INFO */}
    <span className="text-sm sm:text-base text-center">
      {cart.reduce((s, i) => s + i.qty, 0)} items • ₹
      {cart.reduce((s, i) => s + i.qty * Number(i.price), 0)}
    </span>

    {/* ➕ CREATE ORDER */}
    <button
      onClick={() => setShowSummary(true)}
     className="bg-white text-black px-4 py-2 rounded font-semibold w-full sm:w-auto">

    
      Create Order
    </button>
  </div>
)}
    </div>
  );
};

export default MenuScreen;
