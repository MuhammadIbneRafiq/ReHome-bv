import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { dummyData } from "../lib/constants";

const useFetchData = (endpoint: string, queryKey: string) => {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/${endpoint}`);
        return Array.isArray(data) ? data : []; // Ensure it's always an array
      } catch (error) {
        console.error("Error fetching data:", error);
        return dummyData; // Fallback to dummyData on error
      }
    },
    staleTime: 5000, // Optional: Keeps data fresh for 5s
  });
};

export { useFetchData };
