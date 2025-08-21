let iceServers = null;
let iceServersLastFetch = 0;
const ICE_SERVERS_CACHE_DURATION = 3600000;
const https = require("https");

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

module.exports = {
	getICEServers,
};
