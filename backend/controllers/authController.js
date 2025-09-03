const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs"); // <-- Make sure bcrypt is imported
const { signToken } = require("../utils/jwt");
const { loginSchema, registerSchema } = require("../validations/auth");

const handleLogin = async (req, res, next) => {
	// Use Zod safeParse
	const parsed = loginSchema.safeParse(req.body);
	if (!parsed.success) {
		return res
			.status(400)
			.json({ message: parsed.error.errors[0].message }); // Zod error format
	}

	const { email, password } = parsed.data;

	try {
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const token = signToken({
			id: user.id,
			name: user.name,
			email: user.email,
			verified: user.verified,
			inviteCode: user.inviteCode,
		});
		const { password: _, ...safeUser } = user;
		res.cookie("token", token, {
			httpOnly: true,
			sameSite: "None",
		});
		return res.json({ message: "Login successful", token, user: safeUser });
	} catch (err) {
		next(err);
	}
};

const handleRegister = async (req, res, next) => {
	const parsed = registerSchema.safeParse(req.body);
	if (!parsed.success) {
		return res
			.status(400)
			.json({ message: parsed.error.errors[0].message });
	}
	const { name, email, password } = parsed.data;

	try {
		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return res.status(409).json({ message: "User already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await prisma.user.create({
			data: { name, email, password: hashedPassword },
		});

		const token = signToken({ userId: newUser.id });
		const { password: _, ...safeUser } = newUser;
		res.cookie("token", token, { httpOnly: true, sameSite: "None" });
		return res.status(201).json({
			message: "User registered successfully",
			token,
			user: safeUser,
		});
	} catch (err) {
		next(err);
	}
};

module.exports = { handleLogin, handleRegister };
