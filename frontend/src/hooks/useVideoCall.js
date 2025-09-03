import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import api from "../api/api";

export const useVideoCall = () => {
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

		if (peerRef.current && peerRef.current.disconnected) {
			peerRef.current.reconnect();
		}

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
				const { data } = await api.get("api/ice-servers");
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
					skipPeer();
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

	return {
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
	};
};
