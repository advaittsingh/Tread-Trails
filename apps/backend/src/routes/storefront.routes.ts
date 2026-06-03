import { Router } from "express";

import {
  getBookingsUser,
  getOrderReceipt,
  getOrderVerify,
  getOrdersUser,
  getProductRecommendations,
  getUserSavedVehicles,
  getUserWishlist,
  patchUserPreferences,
  patchUserProfile,
  postBooking,
  postJuspaySync,
  postOrder,
  postRazorpayVerify,
  postTrackCart,
  postTrackPage,
  postUserPassword,
  postUserSavedVehicles,
  postUserWishlist,
  putUserSavedVehicles,
  putUserWishlist,
} from "../controllers/storefront.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

export const storefrontRouter = Router();

storefrontRouter.post("/orders", optionalAuth, postOrder);
storefrontRouter.get("/orders/user", requireAuth, getOrdersUser);
storefrontRouter.get("/orders/verify", getOrderVerify);
storefrontRouter.get("/orders/receipt", getOrderReceipt);
storefrontRouter.post("/orders/razorpay/verify", postRazorpayVerify);
storefrontRouter.post("/orders/juspay/sync", postJuspaySync);

storefrontRouter.post("/bookings", optionalAuth, postBooking);
storefrontRouter.get("/bookings/user", requireAuth, getBookingsUser);

storefrontRouter.patch("/user/profile", requireAuth, patchUserProfile);
storefrontRouter.post("/user/password", requireAuth, postUserPassword);
storefrontRouter.get("/user/wishlist", requireAuth, getUserWishlist);
storefrontRouter.post("/user/wishlist", requireAuth, postUserWishlist);
storefrontRouter.put("/user/wishlist", requireAuth, putUserWishlist);
storefrontRouter.get("/user/saved-vehicles", requireAuth, getUserSavedVehicles);
storefrontRouter.post("/user/saved-vehicles", requireAuth, postUserSavedVehicles);
storefrontRouter.put("/user/saved-vehicles", requireAuth, putUserSavedVehicles);
storefrontRouter.patch("/user/preferences", requireAuth, patchUserPreferences);

storefrontRouter.post("/track/cart", postTrackCart);
storefrontRouter.post("/track/page", postTrackPage);

storefrontRouter.get("/products/:slug/recommendations", getProductRecommendations);
