import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import AddHotelForm from '../components/superAdmin/AddHotelForm';
import UUIDModal from "../components/superAdmin/UUIDModal";

const AddHotelPage = () => {
  const navigate = useNavigate();

    const [id, setID] = useState(null);
const handleHotelAdded = (idFromBackend) => {
  setID(idFromBackend);
};

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/superadmin')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <AddHotelForm onHotelAdded={handleHotelAdded} />
      </div>
       {id && (
        <UUIDModal
          id={id}
          onClose={() => {
            navigate('/superadmin');
          setID(null);
  
}}
        />
      )}
    </div>
  );
};

export default AddHotelPage;
