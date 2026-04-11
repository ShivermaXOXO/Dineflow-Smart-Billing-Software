import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const AddProductForm = () => {
  const { hotelId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    type: '',
    image: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear file if user switches back to URL input
    if (e.target.name === 'image' && useFileUpload) {
      setSelectedFile(null);
      setImagePreview('');
    }
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setMessage('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, image: '' })); // Clear URL field
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let imageUrl = formData.image;
      
      // If file is selected, upload it first
      if (selectedFile && useFileUpload) {
        const uploadData = new FormData();
        uploadData.append('image', selectedFile);
        
        const uploadRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
          uploadData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        imageUrl = uploadRes.data.imageUrl;
      }

      // Send product data
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/product/add`, {
        ...formData,
        image: imageUrl,
        hotelId: parseInt(hotelId)
      });
      
      setMessage(res.data.message);
      // Reset form
      setFormData({ name: '', price: '', type: '', image: '' });
      setSelectedFile(null);
      setImagePreview('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mt-6 w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      {message && (
        <p className={`mb-4 ${message.includes('Failed') ? 'text-red-600' : 'text-blue-600'}`}>
          {message}
        </p>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Product Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
        />
        
        <input
          name="price"
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
        />
        
        <input
          name="type"
          placeholder="Category/Type"
          value={formData.type}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
        />
        
        {/* Image Input Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-4 mb-2">
            <button
              type="button"
              onClick={() => setUseFileUpload(false)}
              className={`px-3 py-1 rounded ${!useFileUpload ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              Use Image URL
            </button>
            <span className="text-gray-500">or</span>
            <button
              type="button"
              onClick={() => setUseFileUpload(true)}
              className={`px-3 py-1 rounded ${useFileUpload ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              Upload Image
            </button>
          </div>
          
          {!useFileUpload ? (
            <input
              name="image"
              placeholder="Image URL"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded"
            />
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}
          
          {imagePreview && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded border"
              />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading || (useFileUpload && !selectedFile && !formData.image)}
          className="bg-black text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;