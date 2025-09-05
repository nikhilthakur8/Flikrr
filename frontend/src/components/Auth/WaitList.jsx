import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from "@/components/ui/dialog";
import { BackgroundBeams } from "@/components/ui/background-beams";
import api from "../../api/api";
import { toast } from "sonner";
import { useUserContext } from "../../Context/context";
import { Navigate, useNavigate } from "react-router-dom";

export const WaitList = () => {
	const [inviteCode, setInviteCode] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false); // <-- new state
	const { setUser, user } = useUserContext();
	const navigate = useNavigate();
	if (user.isInvited) {
		return <Navigate to={"/"} replace={true} />;
	}
	const handleSubmit = async () => {
		if (!inviteCode.trim()) {
			toast.error("Please enter an invite code.");
			return;
		}

		setSubmitting(true); // <-- start loading
		try {
			const response = await api.post("/user/register-invite", {
				inviteCode,
			});
			toast.success(
				"Invite code accepted! You can now access the platform."
			);
			setUser(response.data.user);
			navigate("/");
		} catch (error) {
			console.error("Error submitting invite code:", error);
			toast.error(
				error?.response?.data?.message ||
					"Failed to submit invite code. Please try again."
			);
		} finally {
			setSubmitting(false); // <-- stop loading
			setIsOpen(false);
			setInviteCode("");
		}
	};

	return (
		<div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center space-y-5 text-white px-4">
			<h1 className="relative z-10 text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold">
				You're on the Waitlist
			</h1>
			<p className="text-neutral-400 max-w-lg mx-auto text-base text-center relative z-10">
				Omegle is a premium, invite-only platform. You can either wait
				or use an invite code to join.
			</p>

			<div className="flex flex-col items-center gap-4">
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button
							variant="default"
							className="hover:cursor-pointer relative z-10"
						>
							I have an invite code
						</Button>
					</DialogTrigger>

					<DialogContent className="sm:max-w-sm bg-neutral-800 text-white border border-neutral-700 shadow-lg rounded-none">
						<DialogHeader>
							<DialogTitle className="text-white text-lg font-semibold">
								Enter Your Invite Code
							</DialogTitle>
						</DialogHeader>

						<div className="mt-4">
							<Input
								value={inviteCode}
								onChange={(e) => setInviteCode(e.target.value)}
								placeholder="Invite Code"
								className="bg-neutral-700 text-white placeholder:text-neutral-400"
							/>
						</div>

						<DialogFooter>
							<Button
								onClick={handleSubmit}
								disabled={submitting}
								className="w-full bg-white text-neutral-950 hover:bg-neutral-200"
							>
								{submitting ? "Submitting..." : "Submit"}{" "}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<BackgroundBeams />
		</div>
	);
};
