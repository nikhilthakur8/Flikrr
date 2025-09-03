import React from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { Spotlight } from "../ui/spotlight-new";
import { Link } from "react-router-dom";
import { useUserContext } from "../../Context/context";

export const Home = () => {
	const { user } = useUserContext();
	return (
		<section className="bg-neutral-950 text-white h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden relative z-0">
			<Spotlight />
			<h1 className="md:text-5xl text-4xl font-bold bg-gradient-to-t pb-4 from-neutral-500 to-neutral-300 bg-clip-text space-y-2 relative text-transparent">
				<span className="inline-block bg-clip-text text-transparent">
					Omegle
				</span>
				<br />
				Connect. Anonymously. Exclusively.
			</h1>
			<p className="text-lg text-gray-400 max-w-lg mb-8">
				Join <span className="font-semibold">Omegle</span>, the
				invite-only platform for private video conversations.
			</p>
			<Button
				className={
					"text-lg md:text-xl px-5 md:!px-10 py-2 md:py-5 border border-neutral-700"
				}
				variant={"default"}
			>
				{user ? (
					<Link
						to="/anonymous-call"
						className="flex items-center gap-2"
					>
						Start Calling
						<ArrowRight />
					</Link>
				) : (
					<Link
						to="/login"
						className="flex items-center gap-2"
					>
						Get Started
						<ArrowRight />
					</Link>
				)}
			</Button>
		</section>
	);
};
