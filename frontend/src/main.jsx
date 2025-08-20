import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.jsx";
import {
	RouterProvider,
	Routes,
	Route,
	createBrowserRouter,
	createRoutesFromElements,
} from "react-router-dom";
import { Toaster } from "./components/ui/sonner.jsx";

const router = createBrowserRouter(
	createRoutesFromElements(<Route path="/" element={<App />} />)
);

createRoot(document.getElementById("root")).render(
	<>
		<RouterProvider router={router} />
		<Toaster richColors={true} />
	</>
);
