const { getICEServers } = require("../utils/getICEServers");

async function handleGetIceServers(req, res) {
	try {
		const serverData = await getICEServers();
		console.log("Raw server data from Xirsys:", serverData);

		// fallback servers
		const iceServers = [
			{ urls: "stun:stun.l.google.com:19302" },
			{ urls: "stun:stun1.l.google.com:19302" },
			{ urls: "stun:stun2.l.google.com:19302" },
			{ urls: "stun:stun3.l.google.com:19302" },
		];

		if (serverData && Array.isArray(serverData)) {
			serverData.forEach((server) => {
				iceServers.push(server);
			});
		} else if (serverData && serverData.urls) {
			const turnServer = {
				urls: serverData.urls,
				username: serverData.username,
				credential: serverData.credential,
			};
			iceServers.push(turnServer);
		}

		res.json({ iceServers });
	} catch (error) {
		const fallback = [
			{ urls: "stun:stun.l.google.com:19302" },
			{ urls: "stun:stun1.l.google.com:19302" },
			{ urls: "stun:stun2.l.google.com:19302" },
			{ urls: "stun:stun3.l.google.com:19302" },
		];
		res.json({ iceServers: fallback });
	}
}

module.exports = {
	handleGetIceServers,
};
