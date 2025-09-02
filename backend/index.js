const express = require("express");
const http = require("http");
const cors = require("cors");
const { getICEServers } = require("./utils/getICEServers");
const { initSocket } = require("./sockets/io");
const { authenticate } = require("./middleware/authenticate");
const app = express();
const cookieParser = require("cookie-parser");
const server = http.createServer(app);

app.use(
	cors({
		origin:
			NODE_ENV === "development"
				? "http://localhost:5173"
				: "https://flikrr.vercel.app",
		credentials: true,
	})
);

// middleware to parse JSON and urlencoded data
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", authenticate, require("./routes/static"));
app.use("/auth", require("./routes/auth"));
app.use("/user", authenticate, require("./routes/user"));
server.listen(3000, () => {
	getICEServers()
		.then((servers) => {})
		.catch((error) => {
			console.log("Failed to initialize ICE servers:", error);
		});

	initSocket(server);
});
