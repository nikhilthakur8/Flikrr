import React from "react";
import { useUserContext } from "../Context/context";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";

export const ProtectedLayout = () => {
	const { user } = useUserContext();
	const location = useLocation();
	if (!user) {
		return (
			<div className="min-h-svh flex items-center justify-center bg-black text-white">
				<Button variant="default" asChild>
					<Link to={`/login?redirect_uri=${location.pathname}`}>
						Login
					</Link>
				</Button>
			</div>
		);
	}
	return <Outlet />;
};
