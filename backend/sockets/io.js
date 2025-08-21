const { Server } = require("socket.io");
let waitingUsers = [];
let activeConnections = new Map();
let ioInstance = null;
function initSocket(app) {
	ioInstance = new Server(app, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
	});

	// Handle socket connections
	ioInstance.on("connection", (socket) => {
		// Handle getting ICE servers
		// socket.on("getICEServers", async () => {
		// 	try {
		// 		const servers = await getICEServers();
		// 		socket.emit("iceServers", { iceServers: servers });
		// 	} catch (error) {
		// 		console.error("Error getting ICE servers for socket:", error);
		// 		socket.emit("iceServers", {
		// 			iceServers: [
		// 				{ urls: "stun:stun.l.google.com:19302" },
		// 				{ urls: "stun:stun1.l.google.com:19302" },
		// 				{ urls: "stun:stun2.l.google.com:19302" },
		// 				{ urls: "stun:stun3.l.google.com:19302" },
		// 			],
		// 		});
		// 	}
		// });

		// Handle User Joining Find Peer
		socket.on("findPeer", (userData) => {
			disconnectUser(socket.id);

			// Add user to waiting queue
			waitingUsers.push({
				socketId: socket.id,
				peerId: userData.peerId,
				socket: socket,
			});

			matchUsers();
		});

		// Handle Chat Message
		socket.on("sendMessage", (data) => {
			const connection = activeConnections.get(socket.id);
			if (connection) {
				const partnerSocketId = connection.partner;
				const partnerSocket =
					ioInstance.sockets.sockets.get(partnerSocketId);
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
			const connection = activeConnections.get(socket.id);
			if (connection) {
				const partnerSocketId = connection.partner;
				const partnerSocket =
					ioInstance.sockets.sockets.get(partnerSocketId);

				// Notify partner that user left
				if (partnerSocket) {
					partnerSocket.emit("partnerLeft");
				}

				// Remove both users from active connections
				activeConnections.delete(socket.id);
				activeConnections.delete(partnerSocketId);
			}
		});

		socket.on("stopConnection", () => {
			disconnectUser(socket.id);
		});

		// Handle disconnection
		socket.on("disconnect", () => {
			disconnectUser(socket.id);
		});
	});
}

function matchUsers() {
	if (waitingUsers.length >= 2) {
		// Get two users from the waiting queue
		const user1 = waitingUsers.shift();
		const user2 = waitingUsers.shift();

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
		const partnerSocket = ioInstance.sockets.sockets.get(partnerSocketId);

		// Notify partner that user left
		if (partnerSocket) {
			partnerSocket.emit("partnerLeft");
		}

		// Remove both users from active connections
		activeConnections.delete(socketId);
		activeConnections.delete(partnerSocketId);
	}
}

module.exports = {
	initSocket,
	waitingUsers,
	activeConnections,
};
