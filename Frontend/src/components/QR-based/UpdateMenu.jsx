import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const UpdateMenu = () => {
  const { hotelId } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredType, setFilteredType] = useState("All");
  const [loading, setLoading] = useState(true);

  // For Edit Popup
  const [editItem, setEditItem] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState(""); // Separate state for URL input

  const fetchMenu = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/${hotelId}`
      );
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/product/${id}`
        );
        fetchMenu();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [hotelId]);

  const uniqueTypes = ["All", ...new Set(products.map((p) => p.type))];

  const displayedProducts = [...products]
    .filter((p) => filteredType === "All" || p.type === filteredType)
    .sort((a, b) => a.type.localeCompare(b.type));

  // Handle opening edit popup - FIXED
  const handleEditClick = (product) => {
    const currentImage = product.image || product.imageUrl || '';
    
    setEditItem({
      ...product,
      image: currentImage, // Store in image field
      imageUrl: currentImage // Also in imageUrl for display
    });
    
    setEditPreview(currentImage);
    setImageUrlInput(currentImage); // Set URL input separately
    setNewImageFile(null);
    setUseFileUpload(false);
  };

  // Handle Save Edit - COMPLETELY REWRITTEN
  const handleEditSave = async () => {
    if (!editItem) return;
    
    setSaving(true);
    try {
      let finalImage = editItem.image; // Start with current image
      
      console.log("=== STARTING UPDATE ===");
      console.log("Edit item:", editItem);
      console.log("useFileUpload:", useFileUpload);
      console.log("newImageFile:", newImageFile);
      console.log("imageUrlInput:", imageUrlInput);
      
      // CASE 1: User wants to upload new file
      if (useFileUpload && newImageFile) {
        console.log("Uploading new file...");
        const uploadData = new FormData();
        uploadData.append('image', newImageFile);
        
        const uploadRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
          uploadData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        finalImage = uploadRes.data.imageUrl;
        console.log("New file uploaded:", finalImage);
      }
      // CASE 2: User entered new URL
      else if (!useFileUpload && imageUrlInput && imageUrlInput !== editItem.imageUrl) {
        console.log("Using new URL:", imageUrlInput);
        finalImage = imageUrlInput;
      }
      // CASE 3: User cleared the URL (wants to remove image)
      else if (!useFileUpload && imageUrlInput === '') {
        console.log("Clearing image");
        finalImage = '';
      }
      // CASE 4: No changes to image
      else {
        console.log("Keeping existing image:", editItem.image);
        finalImage = editItem.image;
      }
      
      // Prepare update payload
      const updatePayload = {
        name: editItem.name,
        price: parseFloat(editItem.price),
        type: editItem.type,
        image: finalImage, // This is what backend expects
        hotelId: parseInt(hotelId)
      };
      
      console.log("Sending to backend:", updatePayload);
      
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/${editItem.id}`,
        updatePayload
      );
      
      console.log("Backend response:", res.data);
      
      // Close popup and refresh
      setEditItem(null);
      setEditPreview(null);
      setNewImageFile(null);
      setImageUrlInput("");
      setUseFileUpload(false);
      
      // Refresh the product list
      fetchMenu();
      
      alert("✅ Product updated successfully!");
      
    } catch (err) {
      console.error("❌ Update error:", err);
      console.error("Error response:", err.response?.data);
      alert(`❌ Failed to update: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image (JPEG, PNG, GIF, WebP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be less than 5MB');
      return;
    }
    
    setNewImageFile(file);
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle URL input change
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrlInput(url);
    
    // Update preview if it's a valid URL
    if (url) {
      setEditPreview(url);
    } else if (editItem?.image) {
      // If URL cleared, show original image
      setEditPreview(editItem.image);
    } else {
      setEditPreview(null);
    }
  };

  // Handle mode switch
  const handleModeSwitch = (mode) => {
    setUseFileUpload(mode);
    
    if (mode === true) {
      // Switching to file upload mode
      setNewImageFile(null);
      if (editItem?.image && !editItem.image.startsWith('http')) {
        setEditPreview(editItem.image);
      }
    } else {
      // Switching to URL mode
      setNewImageFile(null);
      setImageUrlInput(editItem?.image || '');
      setEditPreview(editItem?.image || null);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mt-6 w-full max-w-6xl overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">Current Menu</h2>

      {/* Filter Dropdown */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Filter by Type:</label>
        <select
          value={filteredType}
          onChange={(e) => setFilteredType(e.target.value)}
          className="border px-3 py-1 rounded"
        >
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading menu...</p>
      ) : displayedProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">#</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Price (₹)</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedProducts.map((product, idx) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-2 border">{idx + 1}</td>

                <td className="p-2 border">
                  {product.image || product.imageUrl ? (
                    <img
                      src={product.image || product.imageUrl}
                      alt={product.name}
                      className="h-16 w-20 object-cover rounded"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x64?text=No+Image';
                      }}
                    />
                  ) : (
                    <span className="text-gray-400 italic">No image</span>
                  )}
                </td>

                <td className="p-2 border">{product.name}</td>
                <td className="p-2 border">{product.type}</td>
                <td className="p-2 border">{parseFloat(product.price).toFixed(2)}</td>
                <td className="p-2 border space-x-3">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* EDIT POPUP - COMPLETELY UPDATED */}
      {editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Menu Item</h3>

            {/* Name */}
            <div className="mb-3">
              <label className="font-semibold block mb-1">Name *</label>
              <input
                className="border w-full px-3 py-2 rounded"
                value={editItem.name}
                onChange={(e) => setEditItem({...editItem, name: e.target.value})}
              />
            </div>

            {/* Price */}
            <div className="mb-3">
              <label className="font-semibold block mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="border w-full px-3 py-2 rounded"
                value={editItem.price}
                onChange={(e) => setEditItem({...editItem, price: e.target.value})}
              />
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="font-semibold block mb-1">Category / Type *</label>
              <input
                className="border w-full px-3 py-2 rounded"
                value={editItem.type}
                onChange={(e) => setEditItem({...editItem, type: e.target.value})}
              />
            </div>

            {/* Current Image Display */}
            <div className="mb-4">
              <label className="font-semibold block mb-2">Current Image:</label>
              {editItem.image ? (
                <img
                  src={editItem.image}
                  alt="Current"
                  className="h-24 w-32 object-cover rounded border mb-2 mx-auto"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/128x96?text=Error';
                  }}
                />
              ) : (
                <p className="text-gray-500 italic text-center mb-2">No image</p>
              )}
            </div>

            {/* Image Update Options */}
            <div className="mb-4">
              <label className="font-semibold block mb-2">Update Image:</label>
              
              {/* Mode Selection */}
              <div className="flex items-center space-x-4 mb-3">
                <button
                  type="button"
                  onClick={() => handleModeSwitch(false)}
                  className={`px-3 py-1 rounded text-sm ${!useFileUpload ? 'bg-black text-white' : 'bg-gray-200'}`}
                >
                  Use Image URL
                </button>
                <span className="text-gray-500 text-sm">or</span>
                <button
                  type="button"
                  onClick={() => handleModeSwitch(true)}
                  className={`px-3 py-1 rounded text-sm ${useFileUpload ? 'bg-black text-white' : 'bg-gray-200'}`}
                >
                  Upload Image
                </button>
              </div>
              
              {/* URL Input Mode */}
              {!useFileUpload && (
                <div>
                  <input
                    type="text"
                    placeholder="Enter new image URL"
                    value={imageUrlInput}
                    onChange={handleUrlChange}
                    className="border w-full px-3 py-2 rounded mb-2"
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to remove image, or enter new URL
                  </p>
                </div>
              )}
              
              {/* File Upload Mode */}
              {useFileUpload && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full mb-2 p-2 border rounded"
                  />
                  {newImageFile && (
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      <p className="font-medium">Selected:</p>
                      <p>{newImageFile.name}</p>
                      <p>Size: {(newImageFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview Section */}
            {(editPreview || imageUrlInput || newImageFile) && (
              <div className="mb-4">
                <label className="font-semibold block mb-2">Preview:</label>
                <img
                  src={editPreview}
                  alt="Preview"
                  className="h-24 w-32 object-cover rounded border mx-auto"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/128x96?text=Invalid+Image';
                  }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditItem(null);
                  setEditPreview(null);
                  setNewImageFile(null);
                  setImageUrlInput("");
                  setUseFileUpload(false);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Debug Section (can remove later) */}
            <div className="mt-4 pt-3 border-t text-xs text-gray-500">
              <p><strong>Debug Info:</strong></p>
              <p>Product ID: {editItem.id}</p>
              <p>Current image in DB: {editItem.image || 'None'}</p>
              <p>URL Input: {imageUrlInput || 'Empty'}</p>
              <p>Mode: {useFileUpload ? 'File Upload' : 'URL'}</p>
              <p>New File: {newImageFile ? newImageFile.name : 'None'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateMenu;