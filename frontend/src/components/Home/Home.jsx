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
	const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, searching, connected

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
		console.log("Partner left");

		// Close current call
		if (currentCallRef.current) {
			currentCallRef.current.close();
			currentCallRef.current = null;
		}

		setRemoteStream(null);
		setIsConnected(false);
		setConnectionStatus("disconnected");
		setIsSearching(false);

		toast.info("Your partner has disconnected");
	}, []);

	const initializePeer = useCallback(async () => {
		try {
			const stream = await getLocalStream();
			if (!stream) return false;

			setLocalStream(stream);

			// Get ICE servers from backend
			let iceServers = [
				{ urls: "stun:stun.l.google.com:19302" },
				{ urls: "stun:stun1.l.google.com:19302" }
			];

			try {
				const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/ice-servers`);
				const data = await response.json();
				if (data.iceServers && data.iceServers.length > 0) {
					iceServers = data.iceServers;
					console.log("Using ICE servers from backend:", iceServers);
				}
			} catch (error) {
				console.log("Failed to get ICE servers from backend, using fallback:", error);
			}

			// Initialize PeerJS with ICE servers configuration
			const peer = new Peer(undefined, {
				config: {
					iceServers: iceServers
				}
			});
			peerRef.current = peer;

			peer.on("open", (id) => {
				setPeerId(id);
				console.log("Peer ID:", id);

				// Initialize Socket.io connection
				const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');
				socketRef.current = socket;

				// Socket event listeners
				socket.on("connect", () => {
					console.log("Connected to server");
					// Request ICE servers via socket as backup
					socket.emit("getICEServers");
				});

				socket.on("iceServers", (data) => {
					console.log("Received ICE servers via socket:", data.iceServers);
					// Update peer configuration if needed (for future connections)
				});

				socket.on("searchingForPeer", () => {
					setConnectionStatus("searching");
					setIsSearching(true);
					setIsConnected(false);
					toast.info("Looking for someone to chat with...");
				});

				socket.on("peerMatched", async (data) => {
					console.log("Matched with peer:", data);
					setConnectionStatus("connected");
					setIsSearching(false);
					setIsConnected(true);
					toast.success("Connected! Say hi!");

					if (data.shouldInitiateCall) {
						// This user should initiate the call
						await callPeer(data.partnerPeerId);
					}
				});

				socket.on("partnerLeft", () => {
					handlePartnerLeft();
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
			});

			peer.on("error", (error) => {
				console.error("PeerJS error:", error);
				toast.error("Connection error: " + error.message);
			});

			return true;
		} catch (error) {
			console.error("Failed to initialize peer:", error);
			toast.error("Failed to initialize connection");
			return false;
		}
	}, [getLocalStream, callPeer, handlePartnerLeft]);

	function startSearch() {
		if (!socketRef.current || !peerId) {
			toast.error("Please wait for connection to initialize");
			return;
		}

		console.log("Starting search for peer");
		setConnectionStatus("searching");
		setIsSearching(true);

		socketRef.current.emit("findPeer", { peerId });
	}

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

		if (socketRef.current) {
			socketRef.current.emit("skipPeer");
		}

		setRemoteStream(null);
		setIsConnected(false);
		setConnectionStatus("disconnected");
		setIsSearching(false);
	}

	useEffect(() => {
		initializePeer();

		return () => {
			// Cleanup on unmount
			if (currentCallRef.current) {
				currentCallRef.current.close();
			}
			if (peerRef.current) {
				peerRef.current.destroy();
			}
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
			// Don't access localStream in cleanup as it's part of state
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		<div className="flex h-screen flex-col md:flex-row bg-gray-50">
			{/* Left panel - Remote video */}
			<div className="flex-1 h-full border border-gray-900 flex flex-col gap-6 items-center justify-center p-6 bg-white shadow-md">
				{/* Video container */}
				<div className="flex-1 w-full min-h-0">
					{remoteStream ? (
						<VideoTile videoRef={remoteStream} />
					) : (
						<div className="flex-1 w-full h-full flex items-center justify-center bg-gray-200 rounded-xl">
							<div className="text-center text-gray-600">
								<div className="text-lg font-semibold mb-2">
									{connectionStatus === "searching"
										? "🔍"
										: connectionStatus === "connected"
										? "📹"
										: "👋"}
								</div>
								<div>{getStatusText()}</div>
								{isSearching && (
									<div className="mt-2">
										<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Control buttons */}
				<div className="w-full h-36 flex justify-center items-center gap-4 rounded-xl bg-gray-100 shadow-inner">
					{connectionStatus === "disconnected" && (
						<button
							className="px-8 py-3 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
							type="button"
							onClick={startSearch}
							disabled={!peerId}
						>
							🚀 Start
						</button>
					)}

					{connectionStatus === "searching" && (
						<button
							className="px-8 py-3 bg-red-600 hover:bg-red-700 transition text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
							type="button"
							onClick={stopConnection}
						>
							❌ Stop
						</button>
					)}

					{connectionStatus === "connected" && (
						<>
							<button
								className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
								type="button"
								onClick={skipPeer}
							>
								⏭️ Next
							</button>
							<button
								className="px-6 py-3 bg-red-600 hover:bg-red-700 transition text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
								type="button"
								onClick={stopConnection}
							>
								❌ Stop
							</button>
						</>
					)}
				</div>
			</div>

			{/* Right panel - Local video and chat */}
			<div className="flex-1 h-full border border-gray-900 flex flex-col gap-6 items-center justify-center p-6 bg-white shadow-md">
				{/* Local video - desktop */}
				<div className="hidden md:block flex-1 h-full w-full min-h-0">
					{localStream ? (
						<VideoTile videoRef={localStream} />
					) : (
						<div className="flex-1 w-full h-full flex items-center justify-center bg-gray-200 rounded-xl">
							<div className="text-center text-gray-600">
								<div className="text-lg mb-2">📷</div>
								<div>Your camera will appear here</div>
							</div>
						</div>
					)}
				</div>

				{/* Local video - mobile (draggable) */}
				{localStream && (
					<Draggable nodeRef={nodeRef}>
						<div
							ref={nodeRef}
							className="md:hidden absolute bottom-4 right-4 w-32 h-24 z-10"
						>
							<VideoTile
								videoRef={localStream}
								containerClassName="w-full h-full border-2 border-white shadow-lg"
							/>
						</div>
					</Draggable>
				)}

				{/* Chat component */}
				<Chat socket={socketRef.current} isConnected={isConnected} />
			</div>
		</div>
	);
};
