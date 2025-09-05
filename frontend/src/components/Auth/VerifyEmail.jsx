import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { toast } from "sonner";
import { useUserContext } from "../../Context/context";

export const VerifyEmail = () => {
	const [verificationCode, setVerificationCode] = useState(Array(6).fill(""));
	const [isLoading, setIsLoading] = useState(false);
	const [resendTimer, setResendTimer] = useState(0);
	const [showInputs, setShowInputs] = useState(false);
	const { setUser, user } = useUserContext();

	const navigate = useNavigate();

	const email = user.email;
	const name = user.name;
	const isVerified = user.isVerified;
	const isInvited = user.isInvited;

	useEffect(() => {
		if (isVerified && isInvited) navigate("/", { replace: true });
		else if (isVerified && !isInvited)
			navigate("/waitlist", { replace: true });
	}, [user]);
	// Resend timer
	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(
				() => setResendTimer(resendTimer - 1),
				1000
			);
			return () => clearTimeout(timer);
		}
	}, [resendTimer]);

	const handleSendCode = async () => {
		setIsLoading(true);
		try {
			const response = await api.post("/auth/send-otp", { email });
			setShowInputs(true);
			setResendTimer(60);
			toast.success(response.data.message || "Verification code sent");
		} catch (error) {
			console.log(error);
			toast.error(error.response?.data?.message || "Failed to send code");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCodeChange = (index, value) => {
		if (value.length <= 1 && /^[0-9]*$/.test(value)) {
			const newCode = [...verificationCode];
			newCode[index] = value;
			setVerificationCode(newCode);

			const nextEmptyIndex = newCode.findIndex(
				(val, i) => i > index && !val
			);
			if (nextEmptyIndex !== -1) {
				document.getElementById(`code-${nextEmptyIndex}`)?.focus();
			} else if (index + 1 < newCode.length) {
				document.getElementById(`code-${index + 1}`)?.focus();
			}
		}
	};

	const handleKeyDown = (index, e) => {
		if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
			document.getElementById(`code-${index - 1}`)?.focus();
		}
	};

	const handleVerify = async (e) => {
		e.preventDefault();
		const code = verificationCode.join("");
		if (code.length !== 6) return;
		setIsLoading(true);
		try {
			const response = await api.post("/auth/verify-otp", {
				email,
				code,
			});
			toast.success(
				response.data.message || "Email verified successfully"
			);
			setUser(response.data?.user);
			const isInvited = response.data?.user?.isInvited;
			if (!isInvited) navigate("/waitlist", { replace: true });
			navigate("/", { replace: true });
		} catch (error) {
			console.error("Verification failed:", error);
			toast.error(error.response?.data?.message || "Verification failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
			<Card className="max-w-md w-full bg-neutral-900 border border-neutral-700 shadow-none rounded-none">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl text-white font-bold mb-2">
						Verify Your Email
					</CardTitle>
					{showInputs && (
						<>
							<p className="text-neutral-400 mb-1">
								We've sent a 6-digit verification code to:
							</p>
							{name && (
								<p className="text-neutral-100 font-semibold break-words mb-1">
									{name}
								</p>
							)}
						</>
					)}
					<p className="text-blue-400 font-semibold break-words">
						{email}
					</p>
				</CardHeader>

				<CardContent>
					{!showInputs && (
						<Button
							onClick={handleSendCode}
							className="w-full bg-white text-neutral-950 hover:bg-neutral-200 border-none rounded-none py-2"
							disabled={isLoading}
						>
							{isLoading ? "Sending..." : "Send Code"}
						</Button>
					)}

					{showInputs && (
						<form onSubmit={handleVerify} className="space-y-5">
							<div className="flex gap-2 justify-center">
								{verificationCode.map((digit, index) => (
									<Input
										key={index}
										id={`code-${index}`}
										type="text"
										maxLength={1}
										value={digit}
										onChange={(e) =>
											handleCodeChange(
												index,
												e.target.value
											)
										}
										onKeyDown={(e) =>
											handleKeyDown(index, e)
										}
										className="w-12 h-12 text-center text-xl font-bold bg-neutral-800 text-white border border-neutral-700 focus:ring-0 rounded-none"
										onFocus={(e) => {
											const input = e.target;
											setTimeout(() => {
												input.setSelectionRange(
													input.value.length,
													input.value.length
												);
											}, 0);
										}}
									/>
								))}
							</div>

							<Button
								type="submit"
								className="w-full bg-white text-neutral-950 hover:bg-neutral-200 border-none rounded-none py-2"
								disabled={isLoading}
							>
								{isLoading ? "Verifying..." : "Verify"}
							</Button>

							<div className="text-center">
								{resendTimer > 0 ? (
									<p className="text-neutral-500 text-sm">
										Resend code in {resendTimer}s
									</p>
								) : (
									<button
										onClick={handleSendCode}
										disabled={isLoading}
										className="text-blue-400 hover:text-blue-300 text-sm font-medium disabled:text-neutral-500 transition-colors flex items-center justify-center gap-1 mx-auto"
									>
										{isLoading ? (
											<>
												<RefreshCw
													size={14}
													className="animate-spin"
												/>{" "}
												Resending...
											</>
										) : (
											"Resend verification code"
										)}
									</button>
								)}
							</div>
						</form>
					)}
				</CardContent>

				<CardFooter className="text-center flex flex-col text-neutral-400 text-xs">
					<p>
						Check your spam folder if you don't see the email. For
						help, contact
					</p>
					<a
						href="mailto:support@flikrr.com"
						className="text-blue-400 block hover:text-blue-300"
					>
						support@flikrr.com
					</a>
				</CardFooter>
			</Card>
		</div>
	);
};
