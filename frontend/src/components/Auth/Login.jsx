import React, { use, useState } from "react";
import { useForm } from "react-hook-form";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import { toast } from "sonner";
import { useUserContext } from "../../Context/context";

export const Login = () => {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const { setUser } = useUserContext();
	const [searchParams] = useSearchParams();
	const redirectUri = searchParams.get("redirect_uri") || "/";
	const navigate = useNavigate();
	const onSubmit = async (data) => {
		try {
			const response = await api.post("/auth/login", data);
			toast.success(response.data.message || "Login successful");
			setUser(response.data.user);
			localStorage.setItem("token", response.data.token);
			const isVerified = response.data.user.isVerified;
			const isInvited = response.data.user.isInvited;
			if (!isVerified) navigate("/verify-email");
			else if (!isInvited) navigate("/waitlist");
			else navigate(redirectUri);
			reset();
		} catch (error) {
			toast.error(error?.response?.data?.message || "Login failed");
		}
	};

	return (
		<div className="min-h-svh px-5 bg-black flex items-center justify-center">
			<Card className="w-md shadow-xl border border-neutral-700 rounded-none backdrop-blur">
				<CardHeader>
					<CardTitle className="text-2xl text-center text-white font-semibold">
						Welcome Back
					</CardTitle>
					<CardDescription className="text-center text-sm text-zinc-400">
						Join the platform to connect with others
					</CardDescription>
				</CardHeader>

				<form onSubmit={handleSubmit(onSubmit)}>
					<CardContent className="space-y-5">
						<Input
							label="Email"
							placeholder="johncena@wwe.com"
							className="text-base"
							{...register("email", {
								required: "Email is required",
								pattern: {
									value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
									message: "Invalid email address",
								},
							})}
							disabled={isSubmitting}
							errors={errors.email}
						/>

						<Input
							label="Password"
							placeholder="You Can't See Me"
							type={isPasswordVisible ? "text" : "password"}
							passwordField={{
								isPasswordVisible,
								setIsPasswordVisible,
							}}
							disabled={isSubmitting}
							className="text-base"
							{...register("password", {
								required: "Password is required",
							})}
							errors={errors.password}
						/>
					</CardContent>

					<CardFooter className="flex flex-col mt-8 space-y-4">
						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full border-none hover:bg-neutral-400 bg-neutral-300 !text-neutral-900 text-lg"
						>
							{isSubmitting ? "Logging in..." : "Login"}
						</Button>

						<div className="text-center text-sm text-gray-400">
							OR
						</div>

						<Button
							className="w-full border-none hover:bg-neutral-400 bg-neutral-300 !text-neutral-900 text-lg space-x-2"
							type="button"
							onClick={() =>
								toast.warning(
									"Men at Work use an email and password !!"
								)
							}
						>
							<img
								src="/google.svg"
								className="w-5 h-5"
								alt="Google logo"
							/>
							<span>Continue with Google</span>
						</Button>

						<p className="text-sm text-gray-400 text-center">
							Don't have an account?{" "}
							<Link
								to="/register"
								className="text-blue-400 hover:underline"
							>
								Register
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
};
