import React from "react";
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
export const Register = () => {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm();

	const [searchParams] = useSearchParams();
	const redirectUri = searchParams.get("redirect_uri") || "/";
	const navigate = useNavigate();
	const { setUser } = useUserContext();
	const onSubmit = async (data) => {
		try {
			const response = await api.post("/auth/register", data);
			setUser(response.data.user);
			toast.success(response.data.message || "Registration successful");
			navigate(redirectUri);
			reset();
		} catch (error) {
			toast.error(error.response?.data?.message || "Registration failed");
		}
	};

	return (
		<div className="min-h-svh bg-black flex items-center justify-center">
			<Card className="w-md shadow-xl border rounded-none border-gray-700/50 backdrop-blur">
				<CardHeader>
					<CardTitle className="text-2xl text-center text-white font-semibold">
						Welcome to Omegle
					</CardTitle>
					<CardDescription className="text-center text-sm text-zinc-400">
						Join the platform to connect with others
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<CardContent className="space-y-5">
						<Input
							label="Name"
							placeholder="John Cena"
							className="text-base"
							{...register("name", {
								required: "Name is required",
								minLength: {
									value: 2,
									message:
										"Name must be at least 2 characters long",
								},
							})}
							errors={errors.name}
							disabled={isSubmitting}
						/>

						<Input
							label="Email"
							placeholder="johncena@wwe.com"
							type="email"
							className="text-base"
							{...register("email", {
								required: "Email is required",
								pattern: {
									value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
									message: "Invalid email address",
								},
							})}
							disabled={isSubmitting}
							errors={errors.email}
						/>

						<Input
							label="Password"
							placeholder="You Can't See Me"
							type="password"
							className="text-base"
							{...register("password", {
								required: "Password is required",
							})}
							disabled={isSubmitting}
							errors={errors.password}
						/>
					</CardContent>

					<CardFooter className="flex flex-col mt-8 space-y-4">
						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full border-none hover:bg-neutral-400 bg-neutral-300 !text-neutral-900 text-lg"
						>
							{isSubmitting ? "Registering..." : "Register"}
						</Button>

						<div className="text-center text-sm text-gray-400">
							OR
						</div>

						<Button
							className="w-full border-none hover:bg-neutral-400 bg-neutral-300 !text-neutral-900 text-lg space-x-2"
							type="button"
							onClick={() => {
								window.location.href = redirectUri;
							}}
						>
							<img
								src="/google.svg"
								className="w-5 h-5"
								alt="Google logo"
							/>
							<span>Continue with Google</span>
						</Button>

						<p className="text-sm text-gray-400 text-center">
							Already have an account?{" "}
							<Link
								to="/login"
								className="text-blue-400 hover:underline"
							>
								Login
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
};
