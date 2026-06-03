import type { Request, Response } from "express";
import type { ZodError } from "zod";

import type { AuthedRequest } from "../middleware/auth.js";
import { buildRecommendationsPayload } from "../services/recommendations.service.js";
import { bookingsService } from "../services/bookings.service.js";
import { ordersService } from "../services/orders.service.js";
import { trackService } from "../services/track.service.js";
import { userService } from "../services/user.service.js";
import {
  bookingCreateSchema,
  createCheckoutOrderSchema,
  juspaySyncSchema,
  razorpayVerifySchema,
} from "../validators/storefront.validators.js";
import { getProductBySlug } from "../services/catalog/products.service.js";

function validationError(res: Response, error: ZodError) {
  return res.status(400).json({
    error: "Validation failed",
    details: error.flatten(),
  });
}

export async function postOrder(req: AuthedRequest, res: Response) {
  const parsed = createCheckoutOrderSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const result = await ordersService.createCheckout(
    parsed.data,
    req.auth?.sub ?? null
  );
  return res.status(result.status).json(result.body);
}

export async function getOrdersUser(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const orders = await ordersService.listForUser(req.auth.sub);
    return res.json({ orders });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load orders" });
  }
}

export async function getOrderVerify(req: Request, res: Response) {
  const sessionId = String(req.query.session_id ?? "").trim();
  if (!sessionId) {
    return res.status(400).json({ error: "session_id required" });
  }
  try {
    const result = await ordersService.verifyStripeSession(sessionId);
    return res.status(result.status).json(result.body);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Verification failed" });
  }
}

export async function getOrderReceipt(req: Request, res: Response) {
  const orderId = String(req.query.order_id ?? "").trim();
  if (!orderId) {
    return res.status(400).json({ error: "order_id required" });
  }
  try {
    const result = await ordersService.getReceipt(orderId);
    return res.status(result.status).json(result.body);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Lookup failed" });
  }
}

export async function postRazorpayVerify(req: Request, res: Response) {
  const parsed = razorpayVerifySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await ordersService.verifyRazorpay(parsed.data);
    return res.status(result.status).json(result.body);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not finalize payment" });
  }
}

export async function postJuspaySync(req: Request, res: Response) {
  const parsed = juspaySyncSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await ordersService.syncJuspay(parsed.data.orderId);
    return res.status(result.status).json(result.body);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Sync failed" });
  }
}

export async function postBooking(req: AuthedRequest, res: Response) {
  const parsed = bookingCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await bookingsService.create(
      parsed.data,
      req.auth?.sub ?? null
    );
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not save booking" });
  }
}

export async function getBookingsUser(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const bookings = await bookingsService.listForUser(req.auth.sub);
    return res.json({ bookings });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load bookings" });
  }
}

export async function patchUserProfile(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  const result = await userService.updateProfile(req.auth.sub, req.body);
  if ("validation" in result && result.validation) {
    return validationError(res, result.validation);
  }
  return res.status(result.status).json(result.body);
}

export async function postUserPassword(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  const result = await userService.changePassword(req.auth.sub, req.body);
  if ("validation" in result && result.validation) {
    return validationError(res, result.validation);
  }
  return res.status(result.status).json(result.body);
}

export async function getUserWishlist(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    return res.json(await userService.getWishlist(req.auth.sub));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not load wishlist" });
  }
}

export async function postUserWishlist(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  const slug = String((req.body as { productSlug?: string })?.productSlug ?? "");
  if (!slug) return res.status(400).json({ error: "Invalid body" });
  const result = await userService.toggleWishlist(req.auth.sub, slug);
  return res.status(result.status).json(result.body);
}

export async function putUserWishlist(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  const result = await userService.replaceWishlist(req.auth.sub, req.body);
  return res.status(result.status).json(result.body);
}

export async function getUserSavedVehicles(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    return res.json(await userService.getSavedVehicles(req.auth.sub));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not load saved vehicles" });
  }
}

export async function postUserSavedVehicles(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  const slug = String((req.body as { vehicleSlug?: string })?.vehicleSlug ?? "");
  if (!slug) return res.status(400).json({ error: "Invalid body" });
  const result = await userService.toggleSavedVehicle(req.auth.sub, slug);
  return res.status(result.status).json(result.body);
}

export async function putUserSavedVehicles(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  const result = await userService.replaceSavedVehicles(req.auth.sub, req.body);
  return res.status(result.status).json(result.body);
}

export async function patchUserPreferences(req: AuthedRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  const result = await userService.patchPreferences(req.auth.sub, req.body);
  return res.status(result.status).json(result.body);
}

export async function postTrackCart(req: Request, res: Response) {
  const result = await trackService.recordCart(req.body);
  return res.status(result.status).json(result.body);
}

export async function postTrackPage(req: Request, res: Response) {
  const result = await trackService.recordPage(req.body);
  return res.status(result.status).json(result.body);
}

export async function getProductRecommendations(req: Request, res: Response) {
  const slug = String(req.params.slug ?? "").trim();
  const product = await getProductBySlug(slug);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  try {
    const payload = await buildRecommendationsPayload(slug);
    return res.json({ source: "api" as const, ...payload });
  } catch (e) {
    console.error(e);
    return res.status(503).json({ error: "Recommendations unavailable" });
  }
}
