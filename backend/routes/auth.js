const { Router } = require("express");
const {
	handleLogin,
	handleRegister,
	handleSendEmailOTP,
	handleLogout,
	handleVerifyOtp,
} = require("../controllers/authController");
const errorHandler = require("../middleware/errorHandler");
const { authenticate } = require("../middleware/authenticate");
const authRouter = Router();

authRouter.post("/login", handleLogin);
authRouter.post("/register", handleRegister);
authRouter.post("/send-otp", authenticate, handleSendEmailOTP);
authRouter.post("/verify-otp", authenticate, handleVerifyOtp);
authRouter.post("/logout", handleLogout);
authRouter.use(errorHandler);

module.exports = authRouter;
