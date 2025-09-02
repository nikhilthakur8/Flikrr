const prisma = require("../prismaClient");

async function handleGetProfile(req, res, next) {
	try {
		const userId = req.user.id;

		let user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const { password, ...safeUser } = user;

		res.json(safeUser);
	} catch (error) {
		next(error);
	}
}

module.exports = { handleGetProfile };
