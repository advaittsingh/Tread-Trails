import { Router } from "express";

import {
  getBrands,
  getBuilds,
  getCompatibility,
  getPaymentsAvailability,
  getPortfolioBuildBySlug,
  getPortfolioBuilds,
  getPortfolioProductBuilds,
  getProducts,
  getVehicles,
  postContact,
  postCorporateInquiry,
  postTrackPing,
} from "../controllers/catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.get("/products", getProducts);
catalogRouter.get("/brands", getBrands);
catalogRouter.get("/vehicles", getVehicles);
catalogRouter.get("/builds", getBuilds);
catalogRouter.get("/compatibility", getCompatibility);
catalogRouter.get("/payments/availability", getPaymentsAvailability);

catalogRouter.get("/portfolio/builds", getPortfolioBuilds);
catalogRouter.get("/portfolio/builds/:slug", getPortfolioBuildBySlug);
catalogRouter.get(
  "/portfolio/products/:productRef/builds",
  getPortfolioProductBuilds
);

catalogRouter.post("/contact", postContact);
catalogRouter.post("/corporate-inquiry", postCorporateInquiry);

catalogRouter.post("/track/ping", postTrackPing);
// track/cart and track/page are on storefrontRouter
