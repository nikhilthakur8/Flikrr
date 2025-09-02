const { Router } = require("express");
const { handleGetProfile } = require("../controllers/userController");
const errorHandler = require("../middleware/errorHandler");
const userRouter = Router();

userRouter.get("/profile", handleGetProfile);
userRouter.use(errorHandler);

module.exports = userRouter;
