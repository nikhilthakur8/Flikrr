const { Router } = require("express");
const {
	handleGetProfile,
	handleRegisterInviteCode,
	handleCreateInviteCode,
} = require("../controllers/userController");
const errorHandler = require("../middleware/errorHandler");
const userRouter = Router();

userRouter.get("/profile", handleGetProfile);
userRouter.post("/create-invite", handleCreateInviteCode);
userRouter.post("/register-invite", handleRegisterInviteCode);
userRouter.use(errorHandler);

module.exports = userRouter;
