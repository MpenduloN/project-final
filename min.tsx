// Get backend URL from environment
const API_URL = import.meta.env.VITE_API_URL;

// Example fetch call
async function fetchData() {
  try {
    const response = await fetch(`${API_URL}/your-endpoint`);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Call the function
fetchData();


import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
