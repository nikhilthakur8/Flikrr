import React, { useEffect, useRef } from "react";

export const VideoTile = ({
	videoRef,
	containerClassName,
	muted = false,
	mirror = false,
	...props
}) => {
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
			className={`flex-1 border border-neutral-700 overflow-hidden w-full h-full min-h-0 ${
				containerClassName || ""
			}`}
			{...props}
		>
			<video
				ref={localRef}
				className="w-full h-full object-cover"
				autoPlay
				playsInline
				muted={muted}
				controls={false}
				style={
					mirror
						? {
								WebkitTransform: "scaleX(-1)",
								transform: "scaleX(-1)",
						  }
						: {}
				}
			/>
		</div>
	);
};
