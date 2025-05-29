import "./App.css";

import App from "./App";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { Toaster } from "@/components/ui/sonner";

import React from "react";
import ReactDOM from "react-dom/client";

// invoke
invoke("start_listening");

listen("discovery", (event) => {
  console.log("Discovery event received:", event.payload);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
);
