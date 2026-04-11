import axios from "axios";

 const  totalVisit = async (phone,hotelId) => {
      if (phone.length < 10) {
        return 0;
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/check`,
          {
            params: {
              phone,
              hotelId
            }
          }
        );
        
       return res.data.visits
      } catch (err) {
        console.error("Customer check failed", err);
      }
    };
    export default totalVisit