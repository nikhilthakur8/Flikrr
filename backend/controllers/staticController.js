const { getICEServers } = require("../utils/getICEServers");

async function handleGetIceServers(req, res) {
	try {
		const iceServers = await getICEServers();
		console.log("ICE servers count:", iceServers.length);
		
		// Log server types for debugging
		const stun = iceServers.filter(s => s.urls.includes('stun')).length;
		const turn = iceServers.filter(s => s.urls.includes('turn')).length;
		console.log(`STUN servers: ${stun}, TURN servers: ${turn}`);

		res.json({ iceServers });
	} catch (error) {
		console.error("Error getting ICE servers:", error);
		
		// Enhanced fallback with TURN servers for cross-network connectivity
		const fallbackServers = [
			// STUN servers
			{ urls: "stun:stun.l.google.com:19302" },
			{ urls: "stun:stun1.l.google.com:19302" },
			{ urls: "stun:stun2.l.google.com:19302" },
			{ urls: "stun:stun3.l.google.com:19302" },
			
			// Free TURN servers for NAT traversal
			{
				urls: "turn:openrelay.metered.ca:80",
				username: "openrelayproject",
				credential: "openrelayproject"
			},
			{
				urls: "turn:openrelay.metered.ca:443",
				username: "openrelayproject", 
				credential: "openrelayproject"
			},
			{
				urls: "turn:relay1.expressturn.com:3478",
				username: "efJLGFKEJFAZXWFE",
				credential: "Qb6WkmRvdPXOhENG"
			}
		];
		
		res.json({ iceServers: fallbackServers });
	}
}

module.exports = {
	handleGetIceServers,
};
