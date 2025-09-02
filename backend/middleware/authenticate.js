const { verifyToken } = require("../utils/jwt");

function authenticate(req, res, next) {
	try {
		const token = req.cookies?.token;
		if (!token) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const user = verifyToken(token);
		req.user = user;

		next();
	} catch (error) {
		next(error);
	}
}

module.exports = { authenticate };
