// VideoTile.jsx
import React, { useEffect, useRef } from "react";

export const VideoTile = ({
	stream, // MediaStream
	containerClassName = "",
	muted = false,
	mirror = false,
	autoPlay = true,
}) => {
	const videoRef = useRef(null);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (stream && typeof stream === "object") {
			try {
				video.srcObject = stream;
				const playPromise = video.play();
				if (playPromise && playPromise.catch) {
					playPromise.catch((err) => {
						// Not fatal — browser may require user gesture
						console.warn("video.play() failed:", err);
					});
				}
			} catch (err) {
				console.error("Error attaching stream to video:", err);
			}
		} else {
			video.srcObject = null;
		}

		return () => {
			try {
				if (video && video.srcObject) video.srcObject = null;
			} catch (e) {}
		};
	}, [stream]);

	return (
		<div className={containerClassName}>
			<video
				ref={videoRef}
				muted={muted}
				playsInline
				autoPlay={autoPlay}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: mirror ? "scaleX(-1)" : "none",
					borderRadius: 8,
				}}
			/>
		</div>
	);
};
