import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { ThemeConfigurator } from "@/components/theme-configurator";
import { SessionExpiryBanner } from "@/components/auth/SessionExpiryBanner";
import { Menu } from "lucide-react";
import { useState } from "react";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Tables from "@/pages/tables";
import Notifications from "@/pages/notifications";
import Subscriptions from "@/pages/subscriptions";
import Documentation from "@/pages/documentation";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import NotFound from "@/pages/not-found";

import { AdminGate } from "@/auth/AdminGate";
import OrdersPage from "@/pages/admin/orders";
import OrderDetailPage from "@/pages/admin/order-detail";
import ProductsPage from "@/pages/admin/products";
import BookingsPage from "@/pages/admin/bookings";
import BrandsPage from "@/pages/admin/brands";
import VehiclesPage from "@/pages/admin/vehicles";
import VehicleMakesPage from "@/pages/admin/vehicle-makes";
import VehicleModelsPage from "@/pages/admin/vehicle-models";
import VehicleCompatibilityPage from "@/pages/admin/vehicle-compatibility";
import VehicleTreePage from "@/pages/admin/vehicle-tree";
import UsersPage from "@/pages/admin/users";
import UserDetailPage from "@/pages/admin/user-detail";
import AnalyticsPage from "@/pages/admin/analytics";
import SystemPage from "@/pages/admin/system/index";
import SystemErrorsPage from "@/pages/admin/system/errors";
import SystemAuditPage from "@/pages/admin/system/audit";
import LeadsPage from "@/pages/admin/leads";
import InboxPage from "@/pages/admin/inbox";
import CartsPage from "@/pages/admin/carts";
import MediaPage from "@/pages/admin/media";
import PortfolioBuildsPage from "@/pages/admin/portfolio-builds";
import InventoryPage from "@/pages/admin/inventory";
import CmsAdminPage from "@/pages/admin/cms";
import SeoPage from "@/pages/admin/seo";

function Layout({ children, title, description }: { children: React.ReactNode; title?: string; description?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);

  return (
    <div className="flex h-screen bg-stone-50 grain-texture">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-10
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      <main className="flex-1 overflow-y-auto p-3 lg:p-6 relative z-10 flex flex-col">
        {/* Mobile header with burger menu */}
        <div className="lg:hidden mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        <Card className="flex-1 border border-stone-200 bg-white relative z-20">
          {title && (
            <div className="pt-6 px-3 lg:px-6 pb-4">
              <h1 className="text-xl font-semibold text-stone-900 mb-1">{title}</h1>
              {description && (
                <p className="text-sm text-stone-600">{description}</p>
              )}
              <div className="border-b border-stone-200 mt-4"></div>
            </div>
          )}
          <div className="px-3 lg:px-6">
            <SessionExpiryBanner />
          </div>
          {children}
        </Card>
        <Footer />
      </main>
      
      {/* Theme Configurator Modal - Outside sidebar for proper z-index */}
      <ThemeConfigurator 
        isOpen={themeConfigOpen} 
        onClose={() => setThemeConfigOpen(false)} 
      />
    </div>
  );
}

function Router() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AdminGate>
            <Layout>
              <Dashboard />
            </Layout>
          </AdminGate>
        }
      />
      <Route path="/profile" element={
        <AdminGate>
          <Layout title="Profile" description="Manage your account settings and personal information">
            <Profile />
          </Layout>
        </AdminGate>
      } />
      <Route path="/tables" element={
        <AdminGate>
          <Layout title="Tables" description="Browse and manage data across different views">
            <Tables />
          </Layout>
        </AdminGate>
      } />
      <Route path="/notifications" element={
        <AdminGate>
          <Layout title="Notifications" description="Stay updated with your latest alerts and messages">
            <Notifications />
          </Layout>
        </AdminGate>
      } />
      <Route path="/subscriptions" element={
        <AdminGate>
          <Layout title="Subscriptions" description="Manage your billing, plans, and subscription settings">
            <Subscriptions />
          </Layout>
        </AdminGate>
      } />
      <Route path="/documentation" element={
        <AdminGate>
          <Layout title="Documentation" description="Installation guide, component examples, and project information">
            <Documentation />
          </Layout>
        </AdminGate>
      } />
      <Route
        path="/orders/:id"
        element={
          <AdminGate>
            <Layout title="Order detail" description="Customer order, fulfilment, and payment">
              <OrderDetailPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/orders"
        element={
          <AdminGate>
            <Layout>
              <OrdersPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/products"
        element={
          <AdminGate>
            <Layout>
              <ProductsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/bookings"
        element={
          <AdminGate>
            <Layout title="Bookings" description="Studio bookings and scheduling">
              <BookingsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/brands"
        element={
          <AdminGate>
            <Layout title="Brands" description="Partner brands">
              <BrandsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/vehicle-tree"
        element={
          <AdminGate>
            <Layout title="Vehicle tree" description="Hierarchy tree with drag-and-drop ordering">
              <VehicleTreePage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/vehicle-compatibility"
        element={
          <AdminGate>
            <Layout title="Vehicle compatibility" description="Product fitment mapping across platforms">
              <VehicleCompatibilityPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/vehicle-models"
        element={
          <AdminGate>
            <Layout title="Vehicle models" description="Model lines under each OEM make">
              <VehicleModelsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/vehicle-makes"
        element={
          <AdminGate>
            <Layout title="Vehicle makes" description="OEM makes in the catalog hierarchy">
              <VehicleMakesPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/vehicles"
        element={
          <AdminGate>
            <Layout title="Vehicles" description="Vehicle catalog and compatibility">
              <VehiclesPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/users/:id"
        element={
          <AdminGate>
            <Layout title="User detail" description="Account profile, activity, and admin actions">
              <UserDetailPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/users"
        element={
          <AdminGate>
            <Layout title="Users" description="User accounts and roles">
              <UsersPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/analytics"
        element={
          <AdminGate>
            <Layout title="Analytics" description="Business analytics and exports">
              <AnalyticsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/system"
        element={
          <AdminGate>
            <Layout title="System" description="Database, API, payments, and email health">
              <SystemPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/system/errors"
        element={
          <AdminGate>
            <Layout title="Error logs" description="Application errors with severity and route filters">
              <SystemErrorsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/system/audit"
        element={
          <AdminGate>
            <Layout title="Audit logs" description="Admin actions across the platform">
              <SystemAuditPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/leads"
        element={
          <AdminGate>
            <Layout title="Leads" description="Manage inquiries, assignments, and outreach">
              <LeadsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/inbox"
        element={
          <AdminGate>
            <Layout title="Inbox" description="Contact and corporate form submissions">
              <InboxPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/carts"
        element={
          <AdminGate>
            <Layout title="Abandoned carts" description="Cart recovery and customer follow-up">
              <CartsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/media"
        element={
          <AdminGate>
            <Layout title="Media manager" description="Upload, organize, and manage assets">
              <MediaPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/inventory"
        element={
          <AdminGate>
            <Layout>
              <InventoryPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/cms"
        element={
          <AdminGate>
            <Layout title="CMS" description="Homepage, brands, vehicles, builds, and marketing pages">
              <CmsAdminPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/seo"
        element={
          <AdminGate>
            <Layout title="SEO" description="Meta tags, canonical URLs, OG images, robots, and structured data">
              <SeoPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route
        path="/portfolio-builds"
        element={
          <AdminGate>
            <Layout title="Portfolio builds" description="Showcase builds, galleries, and product links">
              <PortfolioBuildsPage />
            </Layout>
          </AdminGate>
        }
      />
      <Route path="/auth" element={<Navigate to="/auth/sign-in" replace />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HashRouter>
  );
}

export default App;
