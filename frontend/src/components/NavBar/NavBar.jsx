import React, { useState } from "react";
import { Home, Info, Mail, LogIn } from "lucide-react"; // import icons
import { Button } from "../ui/button.jsx";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { useUserContext } from "../../Context/context.js";

const navItems = [
	{ label: "Home", href: "/" },
	{ label: "Call", href: "/anonymous-call" },
	{ label: "Profile", href: "/profile" },
];

export const NavBar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const navigate = useNavigate();
	const { user } = useUserContext();
	return (
		<nav className="bg-transparent fixed w-full z-[9999999] top-0 left-0 text-white shadow-md">
			<div className="mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 items-center">
					{/* Logo / Brand */}
					<div className="text-3xl font-semibold tracking-wide">
						Flikrr
					</div>

					{/* Desktop Links */}
					<div className="hidden md:flex space-x-10 items-center">
						{navItems.map((item) => (
							<Link
								key={item.label}
								to={item.href}
								className="relative group  text-lg font-medium text-white pb-1 transition-colors duration-300 hover:text-neutral-400"
							>
								<span>{item.label}</span>
								<span className="absolute left-0 -bottom-0.5 h-0.5 w-full bg-neutral-400 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 block"></span>
							</Link>
						))}
					</div>
					{user ? (
						<Link to="/profile" className="hidden md:block">
							<img
								src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.name}`}
								alt={user.name}
								className="w-10 h-10 border border-neutral-700"
							/>
						</Link>
					) : (
						<div className="hidden md:flex space-x-4">
							<InteractiveHoverButton
								className="bg-white hidden md:flex text-black border border-neutral-700"
								onClick={() => navigate("/register")}
							>
								<span>Register</span>
							</InteractiveHoverButton>
							<InteractiveHoverButton
								className="bg-white hidden md:flex text-black border border-neutral-700"
								onClick={() => navigate("/login")}
							>
								<span>Login</span>
							</InteractiveHoverButton>
						</div>
					)}

					{/* Mobile menu button */}
					<div className="md:hidden flex items-center">
						<button
							onClick={() => setIsOpen(!isOpen)}
							className="focus:outline-none"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								{isOpen ? (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								) : (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								)}
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Links */}
			{isOpen && (
				<div className="md:hidden px-4 pb-4 space-y-2">
					{navItems.map((item) => {
						return (
							<a
								key={item.label}
								href={item.href}
								className="flex items-center space-x-1 hover:text-neutral-400"
							>
								<span>{item.label}</span>
							</a>
						);
					})}
				</div>
			)}
		</nav>
	);
};
