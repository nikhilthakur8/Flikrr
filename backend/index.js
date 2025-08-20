const express = require("express");
const http = require("http");
const https = require("https");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

app.use(
	cors({
		origin: "*",
	})
);

// ICE servers cache
let iceServers = null;
let iceServersLastFetch = 0;
const ICE_SERVERS_CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Function to get ICE STUN and TURN servers from Xirsys
async function getICEServers() {
	return new Promise((resolve, reject) => {
		// Check if we have cached servers that are still valid
		const now = Date.now();
		if (
			iceServers &&
			now - iceServersLastFetch < ICE_SERVERS_CACHE_DURATION
		) {
			resolve(iceServers);
			return;
		}

		let o = {
			format: "urls",
		};

		let bodyString = JSON.stringify(o);
		let options = {
			host: "global.xirsys.net",
			path: "/_turn/MyFirstApp",
			method: "PUT",
			headers: {
				Authorization:
					"Basic " +
					Buffer.from(
						"nikhilthakur8012004:89192ace-7e08-11f0-82fc-0242ac140002"
					).toString("base64"),
				"Content-Type": "application/json",
				"Content-Length": bodyString.length,
			},
		};

		let httpreq = https.request(options, function (httpres) {
			let str = "";
			httpres.on("data", function (data) {
				str += data;
			});
			httpres.on("error", function (e) {
				console.log("HTTP response error: ", e);
				reject(e);
			});
			httpres.on("end", function () {
				try {
					const response = JSON.parse(str);
					if (
						response.s === "ok" &&
						response.v &&
						response.v.iceServers
					) {
						iceServers = response.v.iceServers;
						iceServersLastFetch = now;
						resolve(iceServers);
					} else {
						// Fallback to public STUN servers
						console.log("Using fallback STUN servers");
						iceServers = [
							{ urls: "stun:stun.l.google.com:19302" },
							{ urls: "stun:stun1.l.google.com:19302" },
							{ urls: "stun:stun2.l.google.com:19302" },
							{ urls: "stun:stun3.l.google.com:19302" },
						];
						iceServersLastFetch = now;
						resolve(iceServers);
					}
				} catch (parseError) {
					console.log(
						"Error parsing ICE servers response: ",
						parseError
					);
					// Fallback to public STUN servers
					iceServers = [
						{ urls: "stun:stun.l.google.com:19302" },
						{ urls: "stun:stun1.l.google.com:19302" },
						{ urls: "stun:stun2.l.google.com:19302" },
						{ urls: "stun:stun3.l.google.com:19302" },
					];
					iceServersLastFetch = now;
					resolve(iceServers);
				}
			});
		});

		httpreq.on("error", function (e) {
			console.log("Request error: ", e);
			// Fallback to public STUN servers
			iceServers = [
				{ urls: "stun:stun.l.google.com:19302" },
				{ urls: "stun:stun1.l.google.com:19302" },
				{ urls: "stun:stun2.l.google.com:19302" },
				{ urls: "stun:stun3.l.google.com:19302" },
			];
			iceServersLastFetch = now;
			resolve(iceServers);
		});

		httpreq.write(bodyString);
		httpreq.end();
	});
}

app.get("/", (req, res) => {
	res.send("WebRTC Server");
});

// API endpoint to get ICE servers
app.get("/ice-servers", async (req, res) => {
	try {
		const serverData = await getICEServers(); // returns your Xirsys object
		console.log("Raw server data from Xirsys:", serverData);

		// Always include fallback STUN servers
		const iceServers = [
			{ urls: "stun:stun.l.google.com:19302" },
			{ urls: "stun:stun1.l.google.com:19302" },
			{ urls: "stun:stun2.l.google.com:19302" },
			{ urls: "stun:stun3.l.google.com:19302" },
		];

		// Add Xirsys TURN/STUN server if available
		if (serverData && Array.isArray(serverData)) {
			// serverData is already an array of ICE servers
			serverData.forEach((server) => {
				console.log("Adding ICE server:", server);
				iceServers.push(server);
			});
		} else if (serverData && serverData.urls) {
			const turnServer = {
				urls: serverData.urls, // Xirsys URLs array
				username: serverData.username,
				credential: serverData.credential,
			};
			console.log("Adding TURN server:", turnServer);
			iceServers.push(turnServer);
		}

		console.log("Final ICE servers array:", iceServers);
		res.json({ iceServers });
	} catch (error) {
		console.error("Error getting ICE servers:", error);
		// fallback if Xirsys fails
		const fallback = [
			{ urls: "stun:stun.l.google.com:19302" },
			{ urls: "stun:stun1.l.google.com:19302" },
			{ urls: "stun:stun2.l.google.com:19302" },
			{ urls: "stun:stun3.l.google.com:19302" },
		];
		console.log("Using fallback ICE servers:", fallback);
		res.json({ iceServers: fallback });
	}
});

// Store waiting users and active connections
let waitingUsers = [];
let activeConnections = new Map();

io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	// Provide ICE servers to client
	socket.on("getICEServers", async () => {
		try {
			const servers = await getICEServers();
			socket.emit("iceServers", { iceServers: servers });
		} catch (error) {
			console.error("Error getting ICE servers for socket:", error);
			socket.emit("iceServers", {
				iceServers: [
					{ urls: "stun:stun.l.google.com:19302" },
					{ urls: "stun:stun1.l.google.com:19302" },
					{ urls: "stun:stun2.l.google.com:19302" },
					{ urls: "stun:stun3.l.google.com:19302" },
				],
			});
		}
	});

	// Handle user joining the waiting queue
	socket.on("findPeer", (userData) => {
		console.log("User looking for peer:", socket.id, userData);

		// Remove user from any existing connections
		disconnectUser(socket.id);

		// Add user to waiting queue
		waitingUsers.push({
			socketId: socket.id,
			peerId: userData.peerId,
			socket: socket,
		});

		// Try to match with another waiting user
		matchUsers();
	});

	// Handle chat messages
	socket.on("sendMessage", (data) => {
		const connection = activeConnections.get(socket.id);
		if (connection) {
			const partnerSocketId = connection.partner;
			const partnerSocket = io.sockets.sockets.get(partnerSocketId);
			if (partnerSocket) {
				partnerSocket.emit("receiveMessage", {
					message: data.message,
					timestamp: Date.now(),
				});
			}
		}
	});

	// Handle user wanting to skip current partner
	socket.on("skipPeer", () => {
		console.log("User wants to skip:", socket.id);
		const connection = activeConnections.get(socket.id);
		if (connection) {
			const partnerSocketId = connection.partner;
			const partnerSocket = io.sockets.sockets.get(partnerSocketId);

			// Notify partner that user left
			if (partnerSocket) {
				partnerSocket.emit("partnerLeft");
			}

			// Remove both users from active connections
			activeConnections.delete(socket.id);
			activeConnections.delete(partnerSocketId);
		}

		// Add user back to waiting queue
		socket.emit("searchingForPeer");
	});

	// Handle disconnection
	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
		disconnectUser(socket.id);
	});
});

function matchUsers() {
	if (waitingUsers.length >= 2) {
		// Get two users from the waiting queue
		const user1 = waitingUsers.shift();
		const user2 = waitingUsers.shift();

		console.log("Matching users:", user1.socketId, "with", user2.socketId);

		// Create connection between them
		activeConnections.set(user1.socketId, {
			partner: user2.socketId,
			peerId: user1.peerId,
			partnerPeerId: user2.peerId,
		});

		activeConnections.set(user2.socketId, {
			partner: user1.socketId,
			peerId: user2.peerId,
			partnerPeerId: user1.peerId,
		});

		// Notify both users about the match
		user1.socket.emit("peerMatched", {
			partnerPeerId: user2.peerId,
			shouldInitiateCall: true,
		});

		user2.socket.emit("peerMatched", {
			partnerPeerId: user1.peerId,
			shouldInitiateCall: false,
		});
	}
}

function disconnectUser(socketId) {
	// Remove from waiting queue
	waitingUsers = waitingUsers.filter((user) => user.socketId !== socketId);

	// Handle active connection
	const connection = activeConnections.get(socketId);
	if (connection) {
		const partnerSocketId = connection.partner;
		const partnerSocket = io.sockets.sockets.get(partnerSocketId);

		// Notify partner that user left
		if (partnerSocket) {
			partnerSocket.emit("partnerLeft");
		}

		// Remove both users from active connections
		activeConnections.delete(socketId);
		activeConnections.delete(partnerSocketId);
	}
}

server.listen(3001, () => {
	console.log("WebRTC Server is running on port 3001");

	// Initialize ICE servers on startup
	getICEServers()
		.then((servers) => {
			console.log("ICE servers initialized:", servers);
		})
		.catch((error) => {
			console.log("Failed to initialize ICE servers:", error);
		});
});
