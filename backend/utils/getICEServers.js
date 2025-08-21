let iceServers = null;
let iceServersLastFetch = 0;
const ICE_SERVERS_CACHE_DURATION = 3600000;
const https = require("https");

// Enhanced ICE servers with multiple free TURN servers for better cross-network connectivity
function getFallbackICEServers() {
	return [
		// Google STUN servers
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
		{ urls: "stun:stun2.l.google.com:19302" },
		{ urls: "stun:stun3.l.google.com:19302" },
		{ urls: "stun:stun4.l.google.com:19302" },
		
		// Additional STUN servers for redundancy
		{ urls: "stun:stun.stunprotocol.org:3478" },
		{ urls: "stun:stun.voiparound.com" },
		{ urls: "stun:stun.voipbuster.com" },
		{ urls: "stun:stun.voipstunt.com" },
		{ urls: "stun:stun.voxgratia.org" },
		
		// Free TURN servers (these are crucial for cross-network connectivity)
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
			urls: "turn:openrelay.metered.ca:443?transport=tcp",
			username: "openrelayproject",
			credential: "openrelayproject"
		},
		
		// Additional free TURN servers
		{
			urls: "turn:relay1.expressturn.com:3478",
			username: "efJLGFKEJFAZXWFE",
			credential: "Qb6WkmRvdPXOhENG"
		},
		{
			urls: "turn:a.relay.metered.ca:80",
			username: "e74b7c8b4f77cc59eba97f80",
			credential: "pj7e/CZGYNyN1E3A"
		},
		{
			urls: "turn:a.relay.metered.ca:80?transport=tcp",
			username: "e74b7c8b4f77cc59eba97f80",
			credential: "pj7e/CZGYNyN1E3A"
		},
		{
			urls: "turn:a.relay.metered.ca:443",
			username: "e74b7c8b4f77cc59eba97f80",
			credential: "pj7e/CZGYNyN1E3A"
		},
		{
			urls: "turn:a.relay.metered.ca:443?transport=tcp",
			username: "e74b7c8b4f77cc59eba97f80",
			credential: "pj7e/CZGYNyN1E3A"
		}
	];
}

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
			httpres.on("end", function () {
				try {
					const response = JSON.parse(str);
					if (
						response.s === "ok" &&
						response.v &&
						response.v.iceServers
					) {
						// Combine Xirsys servers with fallback servers for maximum compatibility
						const xirsysServers = response.v.iceServers;
						const fallbackServers = getFallbackICEServers();
						iceServers = [...xirsysServers, ...fallbackServers];
						iceServersLastFetch = now;
						console.log("Using Xirsys + fallback ICE servers, total:", iceServers.length);
						resolve(iceServers);
					} else {
						// Use enhanced fallback servers with TURN support
						console.log("Using enhanced fallback ICE servers with TURN support");
						iceServers = getFallbackICEServers();
						iceServersLastFetch = now;
						resolve(iceServers);
					}
				} catch (parseError) {
					console.log(
						"Error parsing ICE servers response: ",
						parseError
					);
					// Use enhanced fallback servers with TURN support
					iceServers = getFallbackICEServers();
					iceServersLastFetch = now;
					resolve(iceServers);
				}
			});
		});
		httpreq.on("error", function (e) {
			console.log("Request error: ", e);
			// Use enhanced fallback servers with TURN support
			iceServers = getFallbackICEServers();
			iceServersLastFetch = now;
			resolve(iceServers);
		});
		httpreq.write(bodyString);
		httpreq.end();
	});
}

module.exports = {
	getICEServers,
};
