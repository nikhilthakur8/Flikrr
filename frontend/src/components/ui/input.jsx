import { EyeClosed, EyeIcon, EyeOffIcon } from "lucide-react";
import React from "react";

export const Input = ({
	label,
	placeholder,
	type = "text",
	className,
	passwordField = null,
	errors = {},
	...props
}) => {
	return (
		<div>
			<label className="block text-sm text-neutral-400 mb-1" htmlFor={label}>
				{label}
			</label>
			<div className="relative">
				<input
					id={label}
					type={type}
					placeholder={placeholder}
					className={`w-full px-4 py-2 bg-neutral-800 text-neutral-100 border 
				focus:outline-none focus:ring-2 ${className}
				${
					errors?.message
						? "border-red-700 focus:ring-red-700"
						: "border-neutral-600 focus:ring-green-600"
				}

				`}
					{...props}
					autoComplete="off"
				/>
				{passwordField && (
					<span
						className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 cursor-pointer"
						onClick={() =>
							passwordField.setIsPasswordVisible((prev) => !prev)
						}
					>
						{passwordField?.isPasswordVisible ? (
							<EyeOffIcon className="h-5 w-5" />
						) : (
							<EyeIcon className="h-5 w-5" />
						)}
					</span>
				)}
			</div>
			{errors && errors.message && (
				<p className="text-red-700 text-sm mt-1">{errors.message}</p>
			)}
		</div>
	);
};
