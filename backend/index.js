const express = require("express");
const http = require("http");
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

app.get("/", (req, res) => {
	res.send("WebRTC Server");
});

// Store waiting users and active connections
let waitingUsers = [];
let activeConnections = new Map();

io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

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
});
