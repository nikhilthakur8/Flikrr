const { Router } = require("express");
const {
	handleLogin,
	handleRegister,
} = require("../controllers/authController");
const errorHandler = require("../middleware/errorHandler");

const authRouter = Router();

authRouter.post("/login", handleLogin);
authRouter.post("/register", handleRegister);
authRouter.use(errorHandler);

module.exports = authRouter;
