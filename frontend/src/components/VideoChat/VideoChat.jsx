/* eslint-disable no-undef */
import React, { useRef } from "react";
import { VideoTile } from "./VideoTile";
import Draggable from "react-draggable";
import { Chat } from "./Chat";
import { useVideoCall } from "../../hooks/useVideoCall";

export const VideoChat = () => {
	const {
		localStream,
		remoteStream,
		peerId,
		isConnected,
		isSearching,
		connectionStatus,
		startSearch,
		stopConnection,
		skipPeer,
		socketRef,
	} = useVideoCall();

	const getStatusText = () => {
		switch (connectionStatus) {
			case "searching":
				return "Looking for someone to chat with...";
			case "connected":
				return "Connected! Enjoy your Calling!";
			default:
				return "Click Start to begin chatting with strangers";
		}
	};

	const nodeRef = useRef(null);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-neutral-900 text-white">
			{/* Mobile Layout */}
			<div className="md:hidden flex flex-col h-full">
				{/* Remote video - full screen on mobile */}
				<div className="flex-1 relative bg-neutral-900 overflow-hidden shadow-md ">
					{remoteStream ? (
						<VideoTile
							videoRef={remoteStream}
							containerClassName="absolute inset-0 w-full h-full object-cover"
						/>
					) : (
						<div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 ">
							<div className="text-center text-neutral-400 px-4">
								<div className="text-lg font-semibold">
									{getStatusText()}
								</div>
								{isSearching && (
									<div className="mt-4">
										<div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mx-auto" />
									</div>
								)}
							</div>
						</div>
					)}

					{/* Local video overlay - draggable */}
					{localStream && (
						<Draggable nodeRef={nodeRef} bounds="parent">
							<div
								ref={nodeRef}
								className="absolute top-4 right-4 w-28 h-36 z-[1000] cursor-move shadow-xl"
							>
								<VideoTile
									videoRef={localStream}
									containerClassName="w-full h-full shadow-xl"
									muted={true}
									mirror={true}
								/>
							</div>
						</Draggable>
					)}
				</div>

				{/* Mobile control panel */}
				<div className="bg-neutral-900 border-t border-neutral-700 p-4 safe-area-bottom shadow-inner">
					{/* Buttons */}
					<div className="flex justify-center items-center gap-3 mb-4 flex-wrap">
						{connectionStatus === "disconnected" && (
							<button
								className="px-5 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 transition text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 text-lg border border-neutral-700"
								onClick={startSearch}
								disabled={!peerId}
							>
								Start
							</button>
						)}

						{connectionStatus === "searching" && (
							<button
								className="px-5 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 transition text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 text-lg border border-neutral-700"
								onClick={stopConnection}
							>
								Stop
							</button>
						)}

						{connectionStatus === "connected" && (
							<>
								<button
									className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg border border-neutral-700"
									onClick={skipPeer}
								>
									Next
								</button>
								<button
									className="px-5 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 transition text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 text-lg border border-neutral-700"
									onClick={stopConnection}
								>
									Stop
								</button>
							</>
						)}
					</div>

					{/* Chat */}
					<div className="h-40 overflow-y-auto shadow-inner">
						<Chat
							socket={socketRef.current}
							isConnected={isConnected}
						/>
					</div>
				</div>
			</div>

			{/* Desktop Layout */}
			<div className="hidden md:flex md:flex-row h-full gap-4 p-4">
				{/* Left - Remote Video */}
				<div className="flex-1 flex flex-col bg-neutral-900 border border-neutral-700 p-4">
					<div className="flex-1 w-full min-h-0 overflow-hidden">
						{remoteStream ? (
							<VideoTile videoRef={remoteStream} />
						) : (
							<div className="flex-1 w-full h-full flex items-center justify-center bg-neutral-900 border border-neutral-700">
								<div className="text-center text-neutral-400">
									<div>{getStatusText()}</div>
									{isSearching && (
										<div className="mt-4">
											<div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mx-auto" />
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Control Buttons */}
					<div className="flex justify-center items-center gap-4 mt-4 flex-wrap">
						{connectionStatus === "disconnected" && (
							<button
								className="px-6 py-3 bg-green-600 hover:bg-green-700 transition text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 border border-neutral-700"
								onClick={startSearch}
								disabled={!peerId}
							>
								Start
							</button>
						)}
						{connectionStatus === "searching" && (
							<button
								className="px-6 py-3 bg-red-600 hover:bg-red-700 transition text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 border border-neutral-700"
								onClick={stopConnection}
							>
								Stop
							</button>
						)}
						{connectionStatus === "connected" && (
							<>
								<button
									className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-neutral-700"
									onClick={skipPeer}
								>
									Next
								</button>
								<button
									className="px-6 py-3 bg-red-600 hover:bg-red-700 transition text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 border border-neutral-700"
									onClick={stopConnection}
								>
									Stop
								</button>
							</>
						)}
					</div>
				</div>

				{/* Right - Local Video & Chat */}
				<div className="flex-1 flex flex-col bg-neutral-900  border border-neutral-700 p-4 gap-4">
					{/* Local Video */}
					<div className="flex-1 w-full min-h-0 overflow-hidden ">
						{localStream ? (
							<VideoTile videoRef={localStream} muted mirror />
						) : (
							<div className="flex-1 w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400 border border-neutral-700">
								<div className="text-center">
									<div>Your camera will appear here</div>
								</div>
							</div>
						)}
					</div>

					{/* Chat */}
					<div className="h-80 overflow-y-auto shadow-inner">
						<Chat
							socket={socketRef.current}
							isConnected={isConnected}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
