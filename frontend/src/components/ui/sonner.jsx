"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = (props) => {
	const { theme = "dark" } = useTheme();

	return (
		<Sonner
			theme={theme}
			className="toaster group !rounded-none"
			style={{
				"--normal-bg": "var(--popover)",
				"--normal-text": "var(--popover-foreground)",
				// "--normal-border": "var(--border)",
				// border: "1px solid #ddd", // light gray border
				borderRadius: "0px !important", // optional rounded corners
			}}
			{...props}
		/>
	);
};

export { Toaster };
