import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTrash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const DisplayKot = ({ 
  savedKOTs = [], 
  printSingleKOT, 
  onDeleteKOT, 
  onSettleBill, 
  tableNo = null,  
  showSettleButton = false 
}) => {
  console.log("DisplayKot props - TableNo:", tableNo);
  console.log("All KOTs:", savedKOTs);
  
  // State to track filtered KOTs
  const [filteredKOTs, setFilteredKOTs] = useState([]);
  
  // Filter KOTs based on table number
  useEffect(() => {
    if (tableNo !== null && tableNo !== undefined) {
      console.log(`Filtering KOTs for table ${tableNo}`);
      
      // Convert tableNo to string for comparison (since it might come as number or string)
      const tableNoStr = String(tableNo);
      
      savedKOTs = JSON.parse(localStorage.getItem("savedKOTs")) || [];
      console.log(savedKOTs);

      // Filter KOTs that match the table number
      savedKOTs = JSON.parse(localStorage.getItem("savedKOTs")) || [];
      console.log(savedKOTs);

      const filtered = savedKOTs.filter(kot => {
        const kotTableNo = kot.tableNumber ? String(kot.tableNumber) : null;
        console.log(`KOT table: ${kotTableNo}, Looking for: ${tableNoStr}, Match: ${kotTableNo === tableNoStr}`);
        return kotTableNo === tableNoStr;
      });
      
      console.log(`Found ${filtered.length} KOTs for table ${tableNo}`);
      setFilteredKOTs(filtered);
    } else {
      // If no tableNo provided, show all KOTs
      setFilteredKOTs(savedKOTs);
    }
  }, [savedKOTs, tableNo]);

  const renderKOT = (kot, index) => {
    const isCompleted = kot.status === 'completed';
    const bgColor = isCompleted ? 'bg-green-50' : 'bg-yellow-50';
    
    return (
      <div
        key={kot.kotId}
        className={`border rounded-lg p-4 shadow-sm ${bgColor}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold flex items-center ">
              KOT #{index + 1}
              {isCompleted && <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />}
            </h3>

          </div>

          <div className="flex gap-2">
            <button
              onClick={() => printSingleKOT(kot)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
            >
              <FontAwesomeIcon icon={faPrint} />
            </button>

            <button
              onClick={() => onDeleteKOT(kot.kotId)}
              className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
            {showSettleButton && (
              <button 
                onClick={() => onSettleBill(kot)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                Settle Bill
              </button>
            )}
          </div>
        </div>

        <div className="border-t pt-2">
          {kot.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span>{item.name}</span>
              <span>x{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (filteredKOTs.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {tableNo ? `Table ${tableNo} No kots` : "No KOTs available"}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-52 overflow-y-auto pr-2">
      {tableNo !== null && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg sticky top-0 z-10">
          <h2 className="text-lg font-bold text-blue-800">
            Total KOTs for Table {tableNo} : {filteredKOTs.length}
          </h2>
        </div>
      )}

      {filteredKOTs.map((kot, i) => renderKOT(kot, i))}
    </div>

  );
};

export default DisplayKot;