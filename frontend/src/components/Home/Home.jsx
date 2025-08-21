/* eslint-disable no-undef */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { VideoTile } from "./VideoTile";
import Draggable from "react-draggable";
import { Chat } from "./Chat";
import { toast } from "sonner";

import Peer from "peerjs";
import io from "socket.io-client";

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

	// get local media
	const getLocalStream = useCallback(async () => {
		try {
			const s = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			return s;
		} catch (error) {
			console.error("Error accessing media:", error);
			toast.error("Please enable camera and microphone");
			return null;
		}
	}, []);

	// stable startSearch (used elsewhere)
	const startSearch = useCallback(() => {
		if (!socketRef.current || !peerRef.current) {
			toast.error("Please wait for connection to initialize");
			return;
		}
		console.log("startSearch -> emitting findPeer", { peerId });
		setConnectionStatus("searching");
		setIsSearching(true);
		socketRef.current.emit("findPeer", { peerId });
	}, [peerId]);

	// handle partner left
	const handlePartnerLeft = useCallback(() => {
		if (currentCallRef.current) {
			try {
				currentCallRef.current.close();
			} catch (e) {}
			currentCallRef.current = null;
		}
		setRemoteStream(null);
		setIsConnected(false);
		setConnectionStatus("disconnected");
		setIsSearching(false);

		// try to find new partner
		startSearch();

		toast.info("Your partner has disconnected");
	}, [startSearch]);

	// call a peer
	const callPeer = useCallback(
		async (targetPeerId) => {
			try {
				const stream = await getLocalStream();
				if (!stream || !peerRef.current) {
					console.warn(
						"No local stream or peer not ready for outgoing call"
					);
					return;
				}

				console.log("Calling peer:", targetPeerId);
				const call = peerRef.current.call(targetPeerId, stream);
				currentCallRef.current = call;

				// debugging and ICE handlers
				if (call.peerConnection) {
					const pc = call.peerConnection;
					pc.onicecandidate = (ev) =>
						console.log("[OUT] onicecandidate", ev?.candidate);
					pc.oniceconnectionstatechange = () =>
						console.log(
							"[OUT] iceConnectionState:",
							pc.iceConnectionState
						);
					pc.onicegatheringstatechange = () =>
						console.log(
							"[OUT] iceGatheringState:",
							pc.iceGatheringState
						);
					pc.onconnectionstatechange = () =>
						console.log(
							"[OUT] connectionState:",
							pc.connectionState
						);
				}

				call.on("stream", (remote) => {
					console.log("Remote stream received (outgoing)");
					setRemoteStream(remote);
				});

				call.on("close", () => {
					console.log("Outgoing call closed");
					setRemoteStream(null);
				});

				call.on("error", (err) => {
					console.error("Outgoing call error:", err);
					toast.error("Failed to establish video connection");
				});
			} catch (err) {
				console.error("callPeer error:", err);
				toast.error("Failed to call peer: " + (err?.message || err));
			}
		},
		[getLocalStream]
	);

	// initialize PeerJS and socket.io
	const initializePeer = useCallback(async () => {
		try {
			const stream = await getLocalStream();
			if (!stream) {
				console.warn("No local stream obtained on init");
				return false;
			}
			setLocalStream(stream);

			// fetch ice servers
			let iceServers = [];
			try {
				const base =
					import.meta.env.VITE_BACKEND_URL ||
					"https://your-backend.example.com";
				const res = await fetch(`${base}/api/ice-servers`);
				const data = await res.json();
				if (data?.iceServers && data.iceServers.length) {
					iceServers = data.iceServers;
					console.log("ICE servers from backend:", iceServers);
				} else {
					console.log(
						"No iceServers returned from backend, using defaults"
					);
				}
			} catch (err) {
				console.warn("Failed to fetch ice servers:", err);
			}

			// create Peer - include iceTransportPolicy for debugging if needed
			const peer = new Peer(undefined, {
				config: {
					iceServers: iceServers,
					iceCandidatePoolSize: 10,
					// Uncomment to force relay-only (verify TURN): iceTransportPolicy: "relay"
				},
				debug: 2,
			});
			peerRef.current = peer;

			peer.on("open", (id) => {
				console.log("Peer open id:", id);
				setPeerId(id);

				// create secure socket connection (use wss/https endpoint in production)
				const endpoint =
					import.meta.env.VITE_BACKEND_URL ||
					"https://your-backend.example.com";
				const socket = io(endpoint, {
					transports: ["websocket", "polling"],
				});
				socketRef.current = socket;

				socket.on("connect", () => {
					console.log("Socket connected:", socket.id);
					socket.emit("registerPeer", { peerId: id });
				});

				socket.on("peerMatched", async (data) => {
					console.log("peerMatched:", data);
					setConnectionStatus("connected");
					setIsSearching(false);
					setIsConnected(true);
					toast.success("Connected!");

					if (data?.shouldInitiateCall) {
						await callPeer(data.partnerPeerId);
					}
				});

				socket.on("partnerLeft", () => {
					console.log("partnerLeft received");
					handlePartnerLeft();
				});

				socket.on("disconnect", (reason) => {
					console.log("Socket disconnected:", reason);
					setConnectionStatus("disconnected");
					setIsSearching(false);
					setIsConnected(false);
				});

				socket.on("iceServers", (payload) => {
					console.log("iceServers event from server:", payload);
				});
			});

			// incoming call handler
			peer.on("call", async (call) => {
				console.log("Incoming call from:", call.peer);
				currentCallRef.current = call;
				const local = await getLocalStream();
				call.answer(local);

				if (call.peerConnection) {
					const pc = call.peerConnection;
					pc.onicecandidate = (ev) =>
						console.log("[IN] onicecandidate", ev?.candidate);
					pc.oniceconnectionstatechange = () =>
						console.log(
							"[IN] iceConnectionState:",
							pc.iceConnectionState
						);
					pc.onicegatheringstatechange = () =>
						console.log(
							"[IN] iceGatheringState:",
							pc.iceGatheringState
						);
					pc.onconnectionstatechange = () =>
						console.log(
							"[IN] connectionState:",
							pc.connectionState
						);
				}

				call.on("stream", (remote) => {
					console.log("Incoming call remote stream received");
					setRemoteStream(remote);
				});

				call.on("close", () => {
					console.log("Incoming call closed");
					setRemoteStream(null);
				});

				call.on("error", (err) => {
					console.error("Incoming call error:", err);
					toast.error("Connection error occurred");
				});
			});

			peer.on("error", (err) => {
				console.error("PeerJS error:", err);
				toast.error("PeerJS error: " + (err?.message || err));
			});

			return true;
		} catch (error) {
			console.error("initializePeer error:", error);
			toast.error("Failed to initialize connection");
			return false;
		}
	}, [getLocalStream, callPeer, handlePartnerLeft]);

	function skipPeer() {
		if (!socketRef.current) return;
		console.log("Skipping current peer");
		if (currentCallRef.current) {
			try {
				currentCallRef.current.close();
			} catch (e) {}
			currentCallRef.current = null;
		}
		setRemoteStream(null);
		socketRef.current.emit("skipPeer");
		setTimeout(() => startSearch(), 500);
	}

	function stopConnection() {
		if (currentCallRef.current) {
			try {
				currentCallRef.current.close();
			} catch (e) {}
			currentCallRef.current = null;
		}
		if (socketRef.current) socketRef.current.emit("stopConnection");
		setRemoteStream(null);
		setIsConnected(false);
		setConnectionStatus("disconnected");
		setIsSearching(false);
	}

	useEffect(() => {
		initializePeer();

		return () => {
			if (currentCallRef.current) {
				try {
					currentCallRef.current.close();
				} catch (e) {}
			}
			if (peerRef.current) {
				try {
					peerRef.current.destroy();
				} catch (e) {}
			}
			if (socketRef.current) {
				try {
					socketRef.current.disconnect();
				} catch (e) {}
			}
			if (localStream) {
				try {
					localStream.getTracks().forEach((t) => t.stop());
				} catch (e) {}
			}
		};
		// run once
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
		<div className="flex h-screen flex-col overflow-hidden bg-gray-50">
			{/* Mobile Layout */}
			<div className="md:hidden flex flex-col h-full">
				<div className="flex-1 relative bg-gray-50 rounded-b-xl overflow-hidden shadow-md">
					{remoteStream ? (
						<VideoTile
							stream={remoteStream}
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

					{localStream && (
						<Draggable nodeRef={nodeRef} bounds="parent">
							<div
								ref={nodeRef}
								className="absolute top-4 right-4 w-28 h-36 z-1000 cursor-move"
							>
								<VideoTile
									stream={localStream}
									containerClassName="w-full h-full border-2 border-gray-500 shadow-xl rounded-lg"
									muted={true}
									mirror={true}
								/>
							</div>
						</Draggable>
					)}
				</div>

				<div className="bg-white border-t border-gray-200 p-4 safe-area-bottom shadow-inner">
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
				<div className="flex-1 flex flex-col bg-white shadow-lg rounded-xl border border-gray-200 p-4">
					<div className="flex-1 w-full min-h-0 rounded-xl overflow-hidden">
						{remoteStream ? (
							<VideoTile stream={remoteStream} />
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

				<div className="flex-1 flex flex-col bg-white shadow-lg rounded-xl border border-gray-200 p-4 gap-4">
					<div className="flex-1 w-full min-h-0 rounded-xl overflow-hidden">
						{localStream ? (
							<VideoTile
								stream={localStream}
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
