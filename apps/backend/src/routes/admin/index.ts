import { Router } from "express";

import { getAnalytics, exportAnalytics } from "../../controllers/admin/analytics.controller.js";
import { getAudit } from "../../controllers/admin/audit.controller.js";
import {
  listBookings,
  getBooking,
  patchBooking,
} from "../../controllers/admin/bookings.controller.js";
import {
  listBrands,
  createBrand,
  getBrand,
  patchBrand,
  deleteBrand,
} from "../../controllers/admin/brands.controller.js";
import { listCarts, recoverCart } from "../../controllers/admin/carts.controller.js";
import {
  getAdminBrandCms,
  getAdminBuildCms,
  getAdminHomepageCms,
  getAdminCmsPage,
  getAdminVehicleCms,
  getCmsPickerOptions,
  listAdminCmsPages,
  patchAdminBrandCms,
  patchAdminBuildCms,
  patchAdminHomepageCms,
  patchAdminCmsPage,
  patchAdminVehicleCms,
} from "../../controllers/admin/cms.controller.js";
import {
  createSeoRoute,
  deleteSeoRoute,
  getSeoDashboard,
  patchSeoRoute,
  patchSeoSettings,
} from "../../controllers/admin/seo.controller.js";
import { sendAdminEmail } from "../../controllers/admin/email.controller.js";
import { getErrors } from "../../controllers/admin/errors.controller.js";
import {
  addStockHandler,
  adjustStockHandler,
  bulkInventoryUpdate,
  exportInventory,
  getInventoryDashboardHandler,
  getInventorySettingsHandler,
  importInventory,
  listInventory,
  listInventoryMovements,
  patchInventoryItem,
  patchInventorySettings,
  purchaseOrderStock,
  removeStockHandler,
  transferStockHandler,
} from "../../controllers/admin/inventory.controller.js";
import {
  bulkInventoryByIds,
  exportInventoryEnriched,
  getInventoryInsightsHandler,
  getInventoryProductBundleHandler,
  getInventorySummaryHandler,
  getPurchaseOrdersHandler,
  getReorderSuggestionsHandler,
  listInventoryEnriched,
} from "../../controllers/admin/inventory-ext.controller.js";
import { listInbox, patchInbox } from "../../controllers/admin/inbox.controller.js";
import {
  listLeads,
  listLeadAssignees,
  getLead,
  patchLead,
  sendLeadEmail,
} from "../../controllers/admin/leads.controller.js";
import {
  listMedia,
  uploadMedia,
  legacyUpload,
  patchMedia,
  deleteMedia,
} from "../../controllers/admin/media.controller.js";
import {
  bulkPatchOrders,
  exportOrders,
  getOrdersSummaryHandler,
  listOrders,
  getOrder,
  patchOrder,
  addOrderNote,
} from "../../controllers/admin/orders.controller.js";
import {
  listPortfolioBuilds,
  createPortfolioBuild,
  getPortfolioBuild,
  patchPortfolioBuild,
  deletePortfolioBuild,
} from "../../controllers/admin/portfolio-builds.controller.js";
import { getPresence } from "../../controllers/admin/presence.controller.js";
import {
  bulkPatchProducts,
  exportProducts,
  getProductBundle,
  getProductsSummaryHandler,
} from "../../controllers/admin/products-ext.controller.js";
import {
  listProducts,
  createProduct,
  getProduct,
  patchProduct,
  deleteProduct,
} from "../../controllers/admin/products.controller.js";
import { getDashboard } from "../../controllers/admin/dashboard.controller.js";
import { getStats } from "../../controllers/admin/stats.controller.js";
import { getSystem } from "../../controllers/admin/system.controller.js";
import {
  listUsers,
  getUser,
  patchUser,
  suspendUser,
  activateUser,
  resetUserPassword,
  forceLogoutUser,
} from "../../controllers/admin/users.controller.js";
import {
  listVehicles,
  createVehicle,
  getVehicle,
  patchVehicle,
  deleteVehicle,
  getVehicleTree,
  backfillVehicleHierarchy,
  getVehicleCompatibility,
  patchVehicleCompatibility,
  reorderVehicleTree,
  bulkAssignCompatibility,
  bulkRemoveCompatibility,
  listVehicleMakes,
  createVehicleMake,
  patchVehicleMake,
  deleteVehicleMake,
  listVehicleModels,
  createVehicleModel,
  patchVehicleModel,
  deleteVehicleModel,
} from "../../controllers/admin/vehicles.controller.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { requireCsrf } from "../../middleware/csrf.js";
import { adminRateLimiter } from "../../middleware/rate-limit.js";
import { adminUpload } from "../../middleware/upload.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);
adminRouter.use(adminRateLimiter);
adminRouter.use(requireCsrf);

adminRouter.get("/dashboard", getDashboard);
adminRouter.get("/stats", getStats);
adminRouter.get("/audit", getAudit);
adminRouter.get("/analytics", getAnalytics);
adminRouter.get("/analytics/export", exportAnalytics);
adminRouter.get("/system", getSystem);
adminRouter.get("/presence", getPresence);
adminRouter.get("/errors", getErrors);

adminRouter.get("/orders/summary", getOrdersSummaryHandler);
adminRouter.get("/orders/export", exportOrders);
adminRouter.post("/orders/bulk", bulkPatchOrders);
adminRouter.get("/orders", listOrders);
adminRouter.get("/orders/:id", getOrder);
adminRouter.patch("/orders/:id", patchOrder);
adminRouter.post("/orders/:id/notes", addOrderNote);

adminRouter.get("/users", listUsers);
adminRouter.get("/users/:id", getUser);
adminRouter.patch("/users/:id", patchUser);
adminRouter.post("/users/:id/suspend", suspendUser);
adminRouter.post("/users/:id/activate", activateUser);
adminRouter.post("/users/:id/reset-password", resetUserPassword);
adminRouter.post("/users/:id/force-logout", forceLogoutUser);

adminRouter.get("/products/summary", getProductsSummaryHandler);
adminRouter.get("/products/export", exportProducts);
adminRouter.post("/products/bulk", bulkPatchProducts);
adminRouter.get("/products", listProducts);
adminRouter.post("/products", createProduct);
adminRouter.get("/products/:id/bundle", getProductBundle);
adminRouter.get("/products/:id", getProduct);
adminRouter.patch("/products/:id", patchProduct);
adminRouter.delete("/products/:id", deleteProduct);

adminRouter.get("/inventory/summary", getInventorySummaryHandler);
adminRouter.get("/inventory/insights", getInventoryInsightsHandler);
adminRouter.get("/inventory/reorder-suggestions", getReorderSuggestionsHandler);
adminRouter.get("/inventory/purchase-orders", getPurchaseOrdersHandler);
adminRouter.get("/inventory/dashboard", getInventoryDashboardHandler);
adminRouter.get("/inventory/settings", getInventorySettingsHandler);
adminRouter.patch("/inventory/settings", patchInventorySettings);
adminRouter.get("/inventory/movements", listInventoryMovements);
adminRouter.get("/inventory/export", exportInventory);
adminRouter.get("/inventory/export-full", exportInventoryEnriched);
adminRouter.post("/inventory/import", importInventory);
adminRouter.post("/inventory/bulk", bulkInventoryUpdate);
adminRouter.post("/inventory/bulk-ids", bulkInventoryByIds);
adminRouter.post("/inventory/transfer", transferStockHandler);
adminRouter.get("/inventory/products/:productId/bundle", getInventoryProductBundleHandler);
adminRouter.get("/inventory", listInventoryEnriched);
adminRouter.patch("/inventory/:productId", patchInventoryItem);
adminRouter.post("/inventory/:productId/add", addStockHandler);
adminRouter.post("/inventory/:productId/remove", removeStockHandler);
adminRouter.post("/inventory/:productId/adjust", adjustStockHandler);
adminRouter.post("/inventory/:productId/purchase", purchaseOrderStock);

adminRouter.get("/cms/homepage", getAdminHomepageCms);
adminRouter.patch("/cms/homepage", patchAdminHomepageCms);
adminRouter.get("/cms/pages", listAdminCmsPages);
adminRouter.get("/cms/pages/:slug", getAdminCmsPage);
adminRouter.patch("/cms/pages/:slug", patchAdminCmsPage);
adminRouter.get("/cms/options", getCmsPickerOptions);
adminRouter.get("/cms/brands/:id", getAdminBrandCms);
adminRouter.patch("/cms/brands/:id", patchAdminBrandCms);
adminRouter.get("/cms/vehicles/:id", getAdminVehicleCms);
adminRouter.patch("/cms/vehicles/:id", patchAdminVehicleCms);
adminRouter.get("/cms/builds/:id", getAdminBuildCms);
adminRouter.patch("/cms/builds/:id", patchAdminBuildCms);

adminRouter.get("/seo", getSeoDashboard);
adminRouter.patch("/seo/settings", patchSeoSettings);
adminRouter.post("/seo/routes", createSeoRoute);
adminRouter.patch("/seo/routes/:id", patchSeoRoute);
adminRouter.delete("/seo/routes/:id", deleteSeoRoute);

adminRouter.get("/brands", listBrands);
adminRouter.post("/brands", createBrand);
adminRouter.get("/brands/:id", getBrand);
adminRouter.patch("/brands/:id", patchBrand);
adminRouter.delete("/brands/:id", deleteBrand);

adminRouter.get("/bookings", listBookings);
adminRouter.get("/bookings/:id", getBooking);
adminRouter.patch("/bookings/:id", patchBooking);

adminRouter.get("/leads", listLeads);
adminRouter.get("/leads/assignees", listLeadAssignees);
adminRouter.get("/leads/:id", getLead);
adminRouter.patch("/leads/:id", patchLead);
adminRouter.post("/leads/:id/email", sendLeadEmail);

adminRouter.get("/inbox", listInbox);
adminRouter.patch("/inbox/:id", patchInbox);

adminRouter.get("/carts", listCarts);
adminRouter.post("/carts/recover", recoverCart);

adminRouter.post("/email", sendAdminEmail);

adminRouter.get("/media", listMedia);
adminRouter.post("/media", adminUpload.single("file"), uploadMedia);
adminRouter.patch("/media/:id", patchMedia);
adminRouter.delete("/media/:id", deleteMedia);

adminRouter.post("/upload", adminUpload.single("file"), legacyUpload);

adminRouter.get("/portfolio-builds", listPortfolioBuilds);
adminRouter.post("/portfolio-builds", createPortfolioBuild);
adminRouter.get("/portfolio-builds/:id", getPortfolioBuild);
adminRouter.patch("/portfolio-builds/:id", patchPortfolioBuild);
adminRouter.delete("/portfolio-builds/:id", deletePortfolioBuild);

adminRouter.get("/vehicles", listVehicles);
adminRouter.post("/vehicles", createVehicle);
adminRouter.get("/vehicles/tree", getVehicleTree);
adminRouter.patch("/vehicles/tree/reorder", reorderVehicleTree);
adminRouter.post("/vehicles/backfill", backfillVehicleHierarchy);
adminRouter.post("/vehicles/compatibility/bulk-assign", bulkAssignCompatibility);
adminRouter.post("/vehicles/compatibility/bulk-remove", bulkRemoveCompatibility);
adminRouter.get("/vehicles/:id", getVehicle);
adminRouter.patch("/vehicles/:id", patchVehicle);
adminRouter.delete("/vehicles/:id", deleteVehicle);
adminRouter.get("/vehicles/:id/compatibility", getVehicleCompatibility);
adminRouter.patch("/vehicles/:id/compatibility", patchVehicleCompatibility);

adminRouter.get("/vehicle-makes", listVehicleMakes);
adminRouter.post("/vehicle-makes", createVehicleMake);
adminRouter.patch("/vehicle-makes/:id", patchVehicleMake);
adminRouter.delete("/vehicle-makes/:id", deleteVehicleMake);

adminRouter.get("/vehicle-models", listVehicleModels);
adminRouter.post("/vehicle-models", createVehicleModel);
adminRouter.patch("/vehicle-models/:id", patchVehicleModel);
adminRouter.delete("/vehicle-models/:id", deleteVehicleModel);
