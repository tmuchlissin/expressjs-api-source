// Root routes with swagger tags
import express from "express";
import { handleRoot, healthCheck } from "../controllers/rootController.js";

const rootRoutes = express.Router();

rootRoutes.get("/", (req, res, next) => {
  // #swagger.tags = ['Root']
  handleRoot(req, res, next);
});

rootRoutes.get("/health-check", (req, res, next) => {
  // #swagger.tags = ['Root']
  healthCheck(req, res, next);
});

export default rootRoutes;

