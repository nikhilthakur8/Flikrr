const prisma = require("../prismaClient");
const { verifyToken } = require("../utils/jwt");

async function authenticate(req, res, next) {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const payload = verifyToken(token);
		if (!payload) {
			return res.status(401).json({ message: "Invalid Token" });
		}

		const findUser = await prisma.user.findUnique({
			where: { id: payload.id },
		});

		if (!findUser) {
			return res.status(401).json({ error: "User not found" });
		}
		req.user = findUser;
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
