const { Router } = require("express");
const { handleGetIceServers } = require("../controllers/staticController");
const staticRouter = Router();

staticRouter.get("/ice-servers", handleGetIceServers);

module.exports = staticRouter;
