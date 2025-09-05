const { verifyToken } = require("../utils/jwt");

function authenticate(req, res, next) {
	try {
		const token = req.cookies?.token;
		if (!token) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const user = verifyToken(token);
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		req.user = user;

		next();
	} catch (error) {
		next(error);
	}
}

function checkInvite(req, res, next) {
	try {
		if (!req.user) return res.status(401).json({ message: "Unauthorized" });

		const isVerified = req.user.isVerified;
		if (!isVerified)
			return res.status(403).json({ message: "Email Not Verified" });

		const isInvited = req.user.isInvited;
		if (!isInvited)
			return res.status(403).json({ message: "No Invite Available" });

		next();
	} catch (error) {
		next(error);
	}
}

module.exports = { authenticate, checkInvite };
