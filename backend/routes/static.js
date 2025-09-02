const { Router } = require("express");
const { handleGetIceServers } = require("../controllers/staticController");
const errorHandler = require("../middleware/errorHandler");
const staticRouter = Router();

staticRouter.get("/ice-servers", handleGetIceServers);
staticRouter.use(errorHandler);

module.exports = staticRouter;
