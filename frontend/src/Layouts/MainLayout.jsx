import React, { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { NavBar } from "../components/NavBar/NavBar";
import api from "../api/api";
import { useUserContext } from "../Context/context";
import { useState } from "react";
import { Button } from "../components/ui/button";

export const MainLayout = () => {
	const { setUser, user } = useUserContext();
	const location = useLocation();

	// Paths where NavBar should NOT be shown
	const hideNavBarOn = ["/anonymous-call"];

	const shouldHideNavBar = hideNavBarOn.includes(location.pathname);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		async function fetchUserProfile() {
			try {
				const { data } = await api.get("/user/profile");
				setUser(data);
			} catch (error) {
				console.error("Error fetching user profile:", error);
			} finally {
				setLoading(false);
			}
		}
		fetchUserProfile();
	}, [setUser]);
	return loading ? (
		<div className="flex items-center justify-center min-h-svh bg-black text-white">
			<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
		</div>
	) : (
		<>
			{!shouldHideNavBar && <NavBar />}
			<Outlet />
		</>
	);
};
