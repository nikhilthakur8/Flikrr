const https = require("https");

async function getICEServers() {
	return new Promise((resolve, reject) => {
		let o = { format: "urls" };
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
			httpres.on("data", (data) => {
				str += data;
			});
			httpres.on("end", () => {
				try {
					const response = JSON.parse(str);
					if (
						response.s === "ok" &&
						response.v &&
						response.v.iceServers
					) {
						resolve(response.v.iceServers);
					} else {
						console.log("Using fallback STUN servers");
						resolve([
							{ urls: "stun:stun.l.google.com:19302" },
							{ urls: "stun:stun1.l.google.com:19302" },
							{ urls: "stun:stun2.l.google.com:19302" },
							{ urls: "stun:stun3.l.google.com:19302" },
						]);
					}
				} catch (parseError) {
					console.log(
						"Error parsing ICE servers response:",
						parseError
					);
					resolve([
						{ urls: "stun:stun.l.google.com:19302" },
						{ urls: "stun:stun1.l.google.com:19302" },
						{ urls: "stun:stun2.l.google.com:19302" },
						{ urls: "stun:stun3.l.google.com:19302" },
					]);
				}
			});
		});

		httpreq.on("error", (e) => {
			console.log("Request error:", e);
			resolve([
				{ urls: "stun:stun.l.google.com:19302" },
				{ urls: "stun:stun1.l.google.com:19302" },
				{ urls: "stun:stun2.l.google.com:19302" },
				{ urls: "stun:stun3.l.google.com:19302" },
			]);
		});

		httpreq.write(bodyString);
		httpreq.end();
	});
}

module.exports = { getICEServers };
