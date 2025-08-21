/* eslint-disable no-undef */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { VideoTile } from "./VideoTile";
import Draggable from "react-draggable";
import { Chat } from "./Chat";
import { toast } from "sonner";

export const Home = () => {
	const peerRef = useRef(null);
	const socketRef = useRef(null);
	const currentCallRef = useRef(null);

	const [localStream, setLocalStream] = useState(null);
	const [remoteStream, setRemoteStream] = useState(null);
	const [peerId, setPeerId] = useState("");
	const [isConnected, setIsConnected] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState("disconnected");

	// Initialize media and peer connection
	const getLocalStream = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			return stream;
		} catch (error) {
			console.log("Error accessing media devices:", error);
			toast.error("Please enable camera and microphone");
			return null;
		}
	}, []);

	const callPeer = useCallback(
		async (peerId) => {
			try {
				const stream = await getLocalStream();
				if (!stream || !peerRef.current) return;

				const call = peerRef.current.call(peerId, stream);
				currentCallRef.current = call;

				call.on("stream", (remoteStream) => {
					console.log("Remote stream received from:", peerId);
					setRemoteStream(remoteStream);
				});

				call.on("close", () => {
					console.log("Call ended");
					setRemoteStream(null);
				});

				call.on("error", (error) => {
					console.error("Call error:", error);
					toast.error("Failed to establish video connection");
				});
			} catch (error) {
				console.error("Error calling peer:", error);
				toast.error("Failed to connect: " + error.message);
			}
		},
		[getLocalStream]
	);

	const handlePartnerLeft = useCallback(() => {
		// Close current call
		if (currentCallRef.current) {
			currentCallRef.current.close();
			currentCallRef.current = null;
		}

		setRemoteStream(null);
		setIsConnected(false);
		setConnectionStatus("disconnected");
		setIsSearching(false);

		// Now request for New Search
		startSearch();

		toast.info("Your partner has disconnected");
	}, []);

	const startSearch = useCallback(() => {
		if (!socketRef.current || !peerRef.current) {
			toast.error("Please wait for connection to initialize");
			return;
		}

		setConnectionStatus("searching");
		setIsSearching(true);

		socketRef.current.emit("findPeer", { peerId });
	}, [peerId, peerRef]);

	const initializePeer = useCallback(async () => {
		try {
			const stream = await getLocalStream();
			if (!stream) return false;

			setLocalStream(stream);

			// Get ICE servers from backend
			let iceServers = [];

			try {
				const response = await fetch(
					`${
						import.meta.env.VITE_BACKEND_URL ||
						"http://localhost:3000"
					}/api/ice-servers`
				);
				const data = await response.json();
				if (data.iceServers && data.iceServers.length > 0) {
					// Format ICE servers correctly
					iceServers = data.iceServers.map((server) => {
						// Handle the TURN server configuration specifically
						if (server.urls instanceof Array) {
							return {
								urls: server.urls,
								username: server.username || "",
								credential: server.credential || "",
							};
						}
						return server;
					});
				} else {
					// Fallback to Google STUN servers
					iceServers = [
						{ urls: "stun:stun.l.google.com:19302" },
						{ urls: "stun:stun1.l.google.com:19302" },
					];
					console.log("Using fallback STUN servers");
				}
			} catch (error) {
				console.log(
					"Failed to get ICE servers from backend, using fallback:",
					error
				);
			}
			// Initialize PeerJS with ICE servers configuration
			const peer = new Peer(undefined, {
				config: {
					iceServers: iceServers,
					iceCandidatePoolSize: 10,
				},
				debug: 1, // Enable debug logs for troubleshooting
			});
			peerRef.current = peer;

			peer.on("open", (id) => {
				setPeerId(id);
				// Initialize Socket.io connection
				const socket = io(
					import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"
				);
				socketRef.current = socket;

				// Socket event listeners
				socket.on("connect", () => {
					// On Connection Get the Ice servers from backend
					socket.emit("getICEServers");
				});

				socket.on("peerMatched", async (data) => {
					setConnectionStatus("connected");
					setIsSearching(false);
					setIsConnected(true);
					toast.success("Connected! Successfully");

					if (data.shouldInitiateCall) {
						// Call the Peer Now
						await callPeer(data.partnerPeerId);
					}
				});

				socket.on("partnerLeft", () => {
					console.log("Partner left the chat");
					handlePartnerLeft(socket);
				});

				socket.on("disconnect", () => {
					console.log("Disconnected from server");
					setConnectionStatus("disconnected");
					setIsSearching(false);
					setIsConnected(false);
				});
			});

			// Handle incoming calls
			peer.on("call", async (call) => {
				console.log("Incoming call from:", call.peer);
				currentCallRef.current = call;

				const stream = await getLocalStream();
				call.answer(stream);

				call.on("stream", (remoteStream) => {
					console.log("Received remote stream");
					setRemoteStream(remoteStream);
				});

				call.on("close", () => {
					console.log("Call ended");
					setRemoteStream(null);
				});

				call.on("error", (error) => {
					console.error("Call error:", error);
					toast.error("Connection error occurred");
				});
				if (call.peerConnection) {
					call.peerConnection.oniceconnectionstatechange = () => {
						console.log(
							"ICE connection state:",
							call.peerConnection.iceConnectionState
						);
						if (
							call.peerConnection.iceConnectionState === "failed"
						) {
							toast.error(
								"Connection failed - trying to reconnect..."
							);
						} else if (
							call.peerConnection.iceConnectionState ===
							"disconnected"
						) {
							toast.warning(
								"Connection lost - attempting to reconnect..."
							);
						} else if (
							call.peerConnection.iceConnectionState ===
							"connected"
						) {
							toast.success("Video connection established!");
						}
					};
				}
			});

			peer.on("error", (error) => {
				console.error("PeerJS error:", error);
				if (error.type === "network") {
					toast.error(
						"Network error - check your internet connection"
					);
				} else if (error.type === "peer-unavailable") {
					toast.error(
						"Partner is not available - trying to reconnect"
					);
					// Try to find a new peer
					setTimeout(() => {
						if (
							socketRef.current &&
							connectionStatus === "connected"
						) {
							socketRef.current.emit("skipPeer");
							setTimeout(() => startSearch(), 1000);
						}
					}, 2000);
				} else {
					toast.error("Connection error: " + error.message);
				}
			});

			return true;
		} catch (error) {
			console.error("Failed to initialize peer:", error);
			toast.error("Failed to initialize connection");
			return false;
		}
	}, [
		getLocalStream,
		callPeer,
		handlePartnerLeft,
		startSearch,
		connectionStatus,
	]);

	function skipPeer() {
		if (!socketRef.current) return;

		console.log("Skipping current peer");

		// Close current call
		if (currentCallRef.current) {
			currentCallRef.current.close();
			currentCallRef.current = null;
		}

		setRemoteStream(null);
		socketRef.current.emit("skipPeer");

		// Automatically start searching for a new peer
		setTimeout(() => {
			startSearch();
		}, 500);
	}

	function stopConnection() {
		if (currentCallRef.current) {
			currentCallRef.current.close();
			currentCallRef.current = null;
		}

		socketRef.current.emit("stopConnection");
		setRemoteStream(null);
		setIsConnected(false);
		setConnectionStatus("disconnected");
		setIsSearching(false);
	}

	useEffect(() => {
		initializePeer();

		return () => {
			if (currentCallRef.current) {
				currentCallRef.current.close();
			}
			if (peerRef.current) {
				peerRef.current.destroy();
			}
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, []);

	const getStatusText = () => {
		switch (connectionStatus) {
			case "searching":
				return "Looking for someone to chat with...";
			case "connected":
				return "Connected! Enjoy your chat!";
			default:
				return "Click Start to begin chatting with strangers";
		}
	};

	const nodeRef = useRef(null);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-gray-50">
			{/* Mobile Layout */}
			<div className="md:hidden flex flex-col h-full">
				{/* Remote video - full screen on mobile */}
				<div className="flex-1 relative bg-gray-50 rounded-b-xl overflow-hidden shadow-md">
					{remoteStream ? (
						<VideoTile
							videoRef={remoteStream}
							containerClassName="absolute inset-0 w-full h-full object-cover rounded-b-xl"
						/>
					) : (
						<div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 ">
							<div className="text-center text-gray-300 px-4">
								<div className="text-lg font-semibold">
									{getStatusText()}
								</div>
								{isSearching && (
									<div className="mt-4">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
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
								className="absolute top-4 right-4 w-28 h-36 z-1000 cursor-move"
							>
								<VideoTile
									videoRef={localStream}
									containerClassName="w-full h-full border-2 border-gray-500 shadow-xl rounded-lg"
									muted={true}
									mirror={true}
								/>
							</div>
						</Draggable>
					)}
				</div>

				{/* Mobile control panel */}
				<div className="bg-white border-t border-gray-200 p-4 safe-area-bottom shadow-inner">
					{/* Buttons */}
					<div className="flex justify-center items-center gap-3 mb-4">
						{connectionStatus === "disconnected" && (
							<button
								className="px-5 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 transition text-white font-semibold rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 text-lg"
								onClick={startSearch}
								disabled={!peerId}
							>
								Start
							</button>
						)}

						{connectionStatus === "searching" && (
							<button
								className="px-5 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 transition text-white font-semibold rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 text-lg"
								onClick={stopConnection}
							>
								Stop
							</button>
						)}

						{connectionStatus === "connected" && (
							<>
								<button
									className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition text-white font-semibold rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
									onClick={skipPeer}
								>
									Next
								</button>
								<button
									className="px-5 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 transition text-white font-semibold rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 text-lg"
									onClick={stopConnection}
								>
									Stop
								</button>
							</>
						)}
					</div>

					{/* Chat */}
					<div className="h-40 overflow-y-auto rounded-lg border border-gray-200 shadow-inner">
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
				<div className="flex-1 flex flex-col bg-white shadow-lg rounded-xl border border-gray-200 p-4">
					<div className="flex-1 w-full min-h-0 rounded-xl overflow-hidden">
						{remoteStream ? (
							<VideoTile videoRef={remoteStream} />
						) : (
							<div className="flex-1 w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
								<div className="text-center text-gray-500">
									<div>{getStatusText()}</div>
									{isSearching && (
										<div className="mt-2">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Control Buttons */}
					<div className="flex justify-center items-center gap-4 mt-4">
						{connectionStatus === "disconnected" && (
							<button
								className="px-6 py-3 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
								onClick={startSearch}
								disabled={!peerId}
							>
								Start
							</button>
						)}
						{connectionStatus === "searching" && (
							<button
								className="px-6 py-3 bg-red-600 hover:bg-red-700 transition text-white font-semibold rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
								onClick={stopConnection}
							>
								Stop
							</button>
						)}
						{connectionStatus === "connected" && (
							<>
								<button
									className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
									onClick={skipPeer}
								>
									Next
								</button>
								<button
									className="px-6 py-3 bg-red-600 hover:bg-red-700 transition text-white font-semibold rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
									onClick={stopConnection}
								>
									Stop
								</button>
							</>
						)}
					</div>
				</div>

				{/* Right - Local Video & Chat */}
				<div className="flex-1 flex flex-col bg-white shadow-lg rounded-xl border border-gray-200 p-4 gap-4">
					{/* Local Video */}
					<div className="flex-1 w-full min-h-0 rounded-xl overflow-hidden">
						{localStream ? (
							<VideoTile
								videoRef={localStream}
								muted
								mirror
								containerClassName="rounded-xl"
							/>
						) : (
							<div className="flex-1 w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
								<div className="text-center text-gray-500">
									<div className="text-lg mb-2">📷</div>
									<div>Your camera will appear here</div>
								</div>
							</div>
						)}
					</div>

					{/* Chat */}
					<div className="h-80 overflow-y-auto rounded-lg border border-gray-200 shadow-inner">
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
