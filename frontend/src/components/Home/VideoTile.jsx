import React, { useEffect, useRef } from "react";

export const VideoTile = ({ videoRef, containerClassName, muted = false, ...props }) => {
	const localRef = useRef(null);

	useEffect(() => {
		if (videoRef && localRef.current) {
			localRef.current.srcObject = videoRef;

			const playPromise = localRef.current.play();
			if (playPromise !== undefined) {
				playPromise.catch((err) => {
					console.warn("Video autoplay failed:", err);
				});
			}
		}
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
				muted={muted}
			/>
		</div>
	);
};
