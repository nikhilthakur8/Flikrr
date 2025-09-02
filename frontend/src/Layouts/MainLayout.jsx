import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavBar } from "../components/NavBar/NavBar";
import api from "../api/api";
import { useUserContext } from "../Context/context";

export const MainLayout = () => {
	const { setUser } = useUserContext();
	const location = useLocation();

	// Paths where NavBar should NOT be shown
	const hideNavBarOn = ["/anonymous-call"];

	const shouldHideNavBar = hideNavBarOn.includes(location.pathname);

	useEffect(() => {
		async function fetchUserProfile() {
			try {
				const { data } = await api.get("/user/profile");
				setUser(data);
			} catch (error) {
				console.error("Error fetching user profile:", error);
			}
		}
		fetchUserProfile();
	}, [setUser]);

	return (
		<div>
			{!shouldHideNavBar && <NavBar />}
			<Outlet />
		</div>
	);
};
