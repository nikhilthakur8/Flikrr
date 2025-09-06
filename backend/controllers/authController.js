const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs"); // <-- Make sure bcrypt is imported
const { signToken } = require("../utils/jwt");
const { loginSchema, registerSchema } = require("../validations/auth");
const { sendCustomEmail } = require("../utils/emailConfig");

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
			verified: user.isVerified,
			inviteCode: user.isInvited,
		});
		const { password: _, ...safeUser } = user;
		res.cookie("token", token, {
			httpOnly: true,
			sameSite: "none",
			secure: true,
			domain:
				process.env.NODE_ENV === "development"
					? "localhost"
					: ".flikrr.vercel.app",
			maxAge: 1 * 24 * 60 * 60 * 1000,
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

		const token = signToken({
			id: newUser.id,
			name: newUser.name,
			email: newUser.email,
			verified: newUser.isVerified,
			inviteCode: newUser.isInvited,
		});
		const { password: _, ...safeUser } = newUser;
		res.cookie("token", token, {
			httpOnly: true,
			sameSite: "none",
			secure: true,
			domain:
				process.env.NODE_ENV === "development"
					? "localhost"
					: "flikrr.vercel.app",
			maxAge: 1 * 24 * 60 * 60 * 1000,
		});
		return res.status(201).json({
			message: "User registered successfully",
			token,
			user: safeUser,
		});
	} catch (err) {
		next(err);
	}
};

const handleLogout = (req, res) => {
	res.clearCookie("token", {
		httpOnly: true,
		sameSite: "None",
		secure: true,
	});
	return res.json({ message: "Logout successful" });
};

const handleSendEmailOTP = async (req, res, next) => {
	try {
		const parsed = registerSchema.partial().safeParse(req.body);
		if (!parsed.success) {
			return res
				.status(400)
				.json({ message: parsed.error.errors[0].message });
		}
		const { email } = parsed.data;
		const isOTPAvailable = await prisma.otp.findFirst({
			where: { email },
			orderBy: {
				createdAt: "desc",
			},
		});

		if (isOTPAvailable && isOTPAvailable.expiresAt > new Date()) {
			return res.status(429).json({
				message:
					"OTP already sent. Please wait before requesting a new one.",
			});
		}

		const generatedOTP = Math.floor(
			100000 + Math.random() * 900000
		).toString();
		const expiryTime = new Date(Date.now() + 1 * 60 * 1000);
		await prisma.otp.create({
			data: {
				email,
				code: generatedOTP,
				expiresAt: expiryTime,
			},
		});

		await sendCustomEmail(
			email,
			"Your OTP Code",
			`Your OTP code is ${generatedOTP}. It will expire in 1 minute.`
		);
		return res.json({ message: "OTP sent successfully" });
	} catch (error) {
		next(error);
	}
};

const handleVerifyOtp = async (req, res, next) => {
	try {
		const { email, code } = req.body;
		const otpRecord = await prisma.otp.findFirst({
			where: { email },
			orderBy: {
				createdAt: "desc",
			},
		});
		if (
			!otpRecord ||
			otpRecord.code !== code ||
			otpRecord.expiresAt < new Date()
		) {
			return res.status(400).json({ message: "Invalid or expired OTP" });
		}
		await prisma.otp.deleteMany({ where: { email } });
		const user = await prisma.user.update({
			where: { email },
			data: { isVerified: true },
		});
		return res.json({ message: "OTP verified successfully", user });
	} catch (error) {
		next(error);
	}
};

module.exports = {
	handleLogin,
	handleRegister,
	handleLogout,
	handleSendEmailOTP,
	handleVerifyOtp,
};
