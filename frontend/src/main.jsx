import { createRoot } from "react-dom/client";
import "./index.css";
import {
	RouterProvider,
	Route,
	createBrowserRouter,
	createRoutesFromElements,
} from "react-router-dom";
import { Toaster } from "./components/ui/sonner.jsx";
import { Login } from "./components/Login/Login.jsx";
import { Register } from "./components/Login/Register.jsx";
import { AuthLayout } from "./Layouts/AuthLayout.jsx";
import { MainLayout } from "./Layouts/MainLayout.jsx";
import { VideoChat } from "./components/VideoChat/VideoChat.jsx";
import { Home } from "./components/Home/Home.jsx";
import { UserProvider } from "./Context/UserProvider.jsx";
import { Profile } from "./components/Profile/Profile.jsx";
const router = createBrowserRouter(
	createRoutesFromElements(
		<Route>
			<Route path="/" element={<AuthLayout />}>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
			</Route>
			<Route path="/" element={<MainLayout />}>
				<Route index element={<Home />} />
				<Route path="/anonymous-call" element={<VideoChat />} />
				<Route path="/profile" element={<Profile />} />	
			</Route>
		</Route>
	)
);

createRoot(document.getElementById("root")).render(
	<>
		<UserProvider>
			<RouterProvider router={router} />
			<Toaster richColors={true} className="!rounded-none" />
		</UserProvider>
	</>
);
