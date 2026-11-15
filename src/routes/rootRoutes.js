// Root routes with swagger tags
const express = require("express");
const { handleRoot, healthCheck } = require("../controllers/rootController");

const rootRoutes = express.Router();

rootRoutes.get("/", (req, res, next) => {
  // #swagger.tags = ['Root']
  handleRoot(req, res, next);
});

rootRoutes.get("/health-check", (req, res, next) => {
  // #swagger.tags = ['Root']
  healthCheck(req, res, next);
});

module.exports = rootRoutes;

