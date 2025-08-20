"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = (props) => {
	const { theme = "light" } = useTheme();

	return (
		<Sonner
			theme={theme}
			className="toaster group"
			style={{
				"--normal-bg": "var(--popover)",
				"--normal-text": "var(--popover-foreground)",
				// "--normal-border": "var(--border)",
				// border: "1px solid #ddd", // light gray border
				// borderRadius: "8px", // optional rounded corners
			}}
			{...props}
		/>
	);
};

export { Toaster };
