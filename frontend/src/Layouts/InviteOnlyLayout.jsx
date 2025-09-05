import React from "react";
import { useUserContext } from "../Context/context";
import { Outlet, Navigate } from "react-router-dom";
import { toast } from "sonner";

export const InviteOnlyLayout = () => {
	const { user } = useUserContext();
	const { isInvited, isVerified } = user;

	if (!isVerified) {
		toast.info("Verify Your Email First");
		return <Navigate to="/verify-email" replace />;
	}

	if (!isInvited) {
		toast.info("You are Currenlty in Waitlist");
		return <Navigate to="/waitlist" replace />;
	}
	return <Outlet />;
};
