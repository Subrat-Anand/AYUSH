import axios from "axios";

// The frontend never sees the Gemini API key. It only talks to YOUR backend,
// which is expected to hold GEMINI_API_KEY as a server-side secret and proxy
// the request to Google's API from there.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
