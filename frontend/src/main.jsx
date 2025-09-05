import { createRoot } from "react-dom/client";
import "./index.css";
import {
	RouterProvider,
	Route,
	createBrowserRouter,
	createRoutesFromElements,
} from "react-router-dom";
import { Toaster } from "./components/ui/sonner.jsx";
import { Login } from "./components/Auth/Login.jsx";
import { Register } from "./components/Auth/Register.jsx";
import { AuthLayout } from "./Layouts/AuthLayout.jsx";
import { MainLayout } from "./Layouts/MainLayout.jsx";
import { VideoChat } from "./components/VideoChat/VideoChat.jsx";
import { Home } from "./components/Home/Home.jsx";
import { UserProvider } from "./Context/UserProvider.jsx";
import { Profile } from "./components/Profile/Profile.jsx";
import { ProtectedLayout } from "./Layouts/ProtectedLayout.jsx";
import { WaitList } from "./components/Auth/WaitList.jsx";
import { VerifyEmail } from "./components/Auth/VerifyEmail.jsx";
import { InviteOnlyLayout } from "./Layouts/InviteOnlyLayout.jsx";
const router = createBrowserRouter(
	createRoutesFromElements(
		<Route>
			<Route element={<AuthLayout />}>
				<Route path="login" element={<Login />} />
				<Route path="register" element={<Register />} />
			</Route>
			<Route element={<MainLayout />}>
				<Route index element={<Home />} />
				<Route element={<ProtectedLayout />}>
					<Route element={<InviteOnlyLayout />}>
						<Route path="anonymous-call" element={<VideoChat />} />
					</Route>
					<Route path="waitlist" element={<WaitList />} />
					<Route path="verify-email" element={<VerifyEmail />} />
					<Route path="profile" element={<Profile />} />
				</Route>
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
