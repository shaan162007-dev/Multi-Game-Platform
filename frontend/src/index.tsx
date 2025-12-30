import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * index.tsx
 *
 * Enhanced for Multi-Game Platform:
 * - Listens for 'load-game' event from index.html
 * - Exposes window.exitToLobby for games to return to lobby
 * - Dark theme only (no light theme toggle)
 */

/* Apply dark theme to DOM */
function applyDarkTheme() {
  const html = document.documentElement;
  const body = document.body;

  html.classList.remove("theme-light");
  body.classList.remove("theme-light");

  html.classList.add("theme-dark");
  body.classList.add("theme-dark");
}

/* Apply dark theme immediately */
applyDarkTheme();

/* Extend Window interface for global functions */
declare global {
  interface Window {
    exitToLobby?: () => void;
  }
}

/* Mount React app */
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found. Make sure #root exists in your HTML.");
}

/* Note: window.exitToLobby is already defined in index.html 
   Your React App component should listen for 'load-game' events like this:
   
   useEffect(() => {
     const handleLoadGame = (e: CustomEvent) => {
       const gameName = e.detail.name;
       // Load the appropriate game component
     };
     
     window.addEventListener('load-game', handleLoadGame as EventListener);
     return () => window.removeEventListener('load-game', handleLoadGame as EventListener);
   }, []);
*/