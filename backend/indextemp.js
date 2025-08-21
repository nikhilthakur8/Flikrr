const express = require("express");
const http = require("http");
const cors = require("cors");
const { getICEServers } = require("./utils/getICEServers");
const { initSocket } = require("./sockets/io");
const app = express();
const server = http.createServer(app);

app.use(
	cors({
		origin: "*",
	})
);

// middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", require("./routes/static"));

server.listen(3000, () => {
	console.log("WebRTC Server is running on port 3000");

	getICEServers()
		.then((servers) => {
			console.log("ICE servers initialized:", servers);
		})
		.catch((error) => {
			console.log("Failed to initialize ICE servers:", error);
		});

	initSocket(server);
});
