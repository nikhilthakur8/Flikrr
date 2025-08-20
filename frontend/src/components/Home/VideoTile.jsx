import React, { useEffect, useRef } from "react";

export const VideoTile = ({ videoRef, containerClassName, ...props }) => {
	const localRef = useRef(null);

	useEffect(() => {
		if (videoRef) localRef.current.srcObject = videoRef;
	}, [videoRef]);

	return (
		<div
			className={`flex-1 w-full h-full min-h-0  ${containerClassName}`}
			{...props}
		>
			<video
				ref={localRef}
				className="w-full h-full object-cover rounded-xl"
				autoPlay
				playsInline
				muted
			/>
		</div>
	);
};
