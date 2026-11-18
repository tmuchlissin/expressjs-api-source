import express from "express";
import { handleRoot, healthCheck } from "../controllers/rootController";

const rootRoutes = express.Router();

rootRoutes.get("/", handleRoot);
rootRoutes.get("/health-check", healthCheck);

export default rootRoutes;
