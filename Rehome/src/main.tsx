import "./index.css";
// Import i18n configuration
import "./i18n";

import App from "./App.tsx";
import { NextUIProvider } from "@nextui-org/react";
import React from "react";
import ReactDOM from "react-dom/client";

// Suppress WebSocket connection errors in production
if (import.meta.env.PROD) {
    const originalError = console.error;
    console.error = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && 
            (message.includes('WebSocket connection') || 
             message.includes('inject.bundle.js') ||
             message.includes('ws://localhost:8098'))) {
            // Suppress these development tool related errors in production
            return;
        }
        originalError(...args);
    };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <NextUIProvider className="h-full">
            <App />
        </NextUIProvider>
    </React.StrictMode>
);
