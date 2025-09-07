const prisma = require("../prismaClient");

async function handleGetProfile(req, res, next) {
	try {
		const userId = req.user.id;

		let user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				inviteCode: true,
			},
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

function generateInviteCode(length = 10) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

async function handleCreateInviteCode(req, res, next) {
	try {
		if (req.user.id != 1) {
			return res
				.status(403)
				.json({ message: "Only admin can create invite codes" });
		}
		const { id: userId } = req.user;

		const { email } = req.body;
		const existingCode = await prisma.inviteCode.findFirst({
			where: { userId },
		});

		if (existingCode) {
			return res
				.status(409)
				.json({ message: "Invite code already exists" });
		}

		await prisma.inviteCode.create({
			data: {
				code: generateInviteCode(),
				user: {
					connect: { id: userId },
				},
				maxUsage: 5,
				usedCount: 0,
			},
		});

		const updatedUser = await prisma.user.update({
			where: { email },
			data: { isInvited: true },
			include: {
				inviteCode: true,
			},
		});

		const { password, ...safeUser } = updatedUser;

		return res.json({
			message: "Invite code generated successfully",
			user: safeUser,
		});
	} catch (error) {
		next(error);
	}
}

async function handleRegisterInviteCode(req, res, next) {
	try {
		const { inviteCode } = req.body;
		const { id, email, isInvited } = req.user;

		if (isInvited) {
			return res.status(400).json({ message: "User is already invited" });
		}

		const maxUsage = 5;

		const updatedUser = await prisma.$transaction(async (tx) => {
			const inviterCode = await tx.inviteCode.findUnique({
				where: { code: inviteCode },
			});

			if (!inviterCode || inviterCode.usedCount >= maxUsage) {
				throw new Error("Invalid or expired invite code");
			}

			await tx.inviteCode.update({
				where: { code: inviteCode },
				data: { usedCount: { increment: 1 } },
			});

			await tx.inviteCode.create({
				data: {
					code: generateInviteCode(),
					user: { connect: { id } },
					maxUsage: 5,
					usedCount: 0,
				},
			});

			return tx.user.update({
				where: { email },
				data: {
					isInvited: true,
					invitedBy: inviterCode.userId,
				},
				include: {
					inviteCode: true,
				},
			});
		});

		const { password, ...safeUser } = updatedUser;

		return res.json({
			message: "Registered with invite code successfully",
			user: safeUser,
		});
	} catch (error) {
		if (error.message === "Invalid or expired invite code") {
			return res.status(400).json({ message: error.message });
		}
		next(error);
	}
}
module.exports = {
	handleGetProfile,
	handleCreateInviteCode,
	handleRegisterInviteCode,
};
