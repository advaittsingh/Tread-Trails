import type { Request, Response } from "express";
import type { ZodError } from "zod";

import { PORTFOLIO_PRODUCT_LINK_META, portfolioBuildPayload } from "../lib/api/portfolio-payload.js";
import {
  isJuspayConfigured,
  isRazorpayConfigured,
  isStripePaymentsConfigured,
} from "../lib/payments/gateway-env.js";
import { buildsService } from "../services/catalog/builds.service.js";
import { brandsService } from "../services/catalog/brands.service.js";
import {
  listBuildsReferencingProduct,
  resolvePortfolioLinkedProducts,
} from "../services/catalog/portfolio.service.js";
import {
  getProductBySlug,
  listProducts,
  listProductsForVehicleSlug,
} from "../services/catalog/products.service.js";
import { vehiclesService } from "../services/catalog/vehicles.service.js";
import { inquiryService } from "../services/inquiry.service.js";
import { trackService } from "../services/track.service.js";
import {
  contactFormSchema,
  corporateInquirySchema,
} from "../validators/inquiry.validators.js";

function validationError(res: Response, error: ZodError) {
  return res.status(400).json({
    error: "Validation failed",
    details: error.flatten(),
  });
}

export async function getProducts(req: Request, res: Response) {
  const slug = String(req.query.slug ?? "").trim();
  const vehicleSlug = String(req.query.vehicleSlug ?? "").trim();

  try {
    if (slug) {
      const product = await getProductBySlug(slug);
      if (!product) return res.status(404).json({ error: "Not found" });
      return res.json({ product });
    }

    if (vehicleSlug) {
      const products = await listProductsForVehicleSlug(vehicleSlug);
      return res.json({ products });
    }

    const products = await listProducts();
    return res.json({ products });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load products" });
  }
}

export async function getBrands(req: Request, res: Response) {
  const slug = String(req.query.slug ?? "").trim();

  try {
    if (slug) {
      const result = await brandsService.getBySlug(slug);
      if (!result) return res.status(404).json({ error: "Not found" });
      return res.json(result);
    }

    const brands = await brandsService.list();
    return res.json({ brands });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load brands" });
  }
}

export async function getVehicles(req: Request, res: Response) {
  const slug = String(req.query.slug ?? "").trim();

  try {
    if (slug) {
      const vehicle = await vehiclesService.getBySlug(slug);
      if (!vehicle) return res.status(404).json({ error: "Not found" });
      return res.json({ vehicle });
    }

    const vehicles = await vehiclesService.list();
    return res.json({ vehicles });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load vehicles" });
  }
}

export async function getBuilds(req: Request, res: Response) {
  const slug = String(req.query.slug ?? "").trim();
  const vehicleSlug = String(req.query.vehicleSlug ?? "").trim();

  try {
    if (slug) {
      const build = await buildsService.getBySlug(slug);
      if (!build) return res.status(404).json({ error: "Not found" });
      return res.json({ build: portfolioBuildPayload(build) });
    }

    const builds = await buildsService.list(vehicleSlug || undefined);
    return res.json({
      builds: builds.map((b) => portfolioBuildPayload(b)),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load builds" });
  }
}

export async function getCompatibility(req: Request, res: Response) {
  const vehicleSlug = String(req.query.vehicleSlug ?? "").trim();

  if (!vehicleSlug) {
    return res.status(400).json({
      error: "Missing vehicleSlug query parameter",
    });
  }

  try {
    const products = await listProductsForVehicleSlug(vehicleSlug);
    return res.json({
      vehicleSlug,
      count: products.length,
      products,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load compatible products" });
  }
}

export async function getPaymentsAvailability(_req: Request, res: Response) {
  return res.json({
    stripe: isStripePaymentsConfigured(),
    razorpay: isRazorpayConfigured(),
    juspay: isJuspayConfigured(),
    cod: true,
  });
}

export async function getPortfolioBuilds(req: Request, res: Response) {
  const vehicleSlug = String(req.query.vehicleSlug ?? "").trim();

  try {
    const builds = await buildsService.list(vehicleSlug || undefined);
    return res.json({
      meta: { productBuildRelation: PORTFOLIO_PRODUCT_LINK_META.model },
      builds: builds.map((b) => portfolioBuildPayload(b)),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load portfolio builds" });
  }
}

export async function getPortfolioBuildBySlug(req: Request, res: Response) {
  const slug = String(req.params.slug ?? "").trim();
  const expand = String(req.query.expand ?? "").trim();

  try {
    const build = await buildsService.getBySlug(slug);
    if (!build) return res.status(404).json({ error: "Not found" });

    const base = {
      meta: { productBuildRelation: PORTFOLIO_PRODUCT_LINK_META.model },
      build: portfolioBuildPayload(build),
    };

    if (expand === "products") {
      const products = await resolvePortfolioLinkedProducts(
        build.slug,
        build.productIds
      );
      return res.json({ ...base, products });
    }

    return res.json(base);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load portfolio build" });
  }
}

export async function getPortfolioProductBuilds(req: Request, res: Response) {
  const productRef = decodeURIComponent(String(req.params.productRef ?? "")).trim();

  if (!productRef) {
    return res.status(400).json({ error: "productRef required" });
  }

  try {
    const { catalogToken, builds } = await listBuildsReferencingProduct(productRef);
    return res.json({
      meta: {
        productBuildRelation: PORTFOLIO_PRODUCT_LINK_META.model,
        resolvedCatalogToken: catalogToken,
      },
      builds: builds.map((b) => portfolioBuildPayload(b)),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to resolve portfolio links" });
  }
}

export async function postContact(req: Request, res: Response) {
  const parsed = contactFormSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const result = await inquiryService.submitContact(parsed.data);
  return res.status(result.status).json(result.body);
}

export async function postCorporateInquiry(req: Request, res: Response) {
  const parsed = corporateInquirySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const result = await inquiryService.submitCorporate(parsed.data);
  return res.status(result.status).json(result.body);
}

export async function postTrackPing(req: Request, res: Response) {
  const result = await trackService.ping(req.body, req.headers as Record<string, string | string[] | undefined>);
  return res.status(result.status).json(result.body);
}
