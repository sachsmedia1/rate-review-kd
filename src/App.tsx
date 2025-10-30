import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Setup = lazy(() => import("./pages/Setup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewReview = lazy(() => import("./pages/NewReview"));
const Reviews = lazy(() => import("./pages/admin/Reviews"));
const EditReview = lazy(() => import("./pages/admin/EditReview"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const Images = lazy(() => import("./pages/admin/Images"));
const Users = lazy(() => import("./pages/admin/Users"));
const DataQuality = lazy(() => import("./pages/admin/DataQuality"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const ReviewDetail = lazy(() => import("./pages/ReviewDetail"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/bewertung/:slug" element={<ReviewDetail />} />
                <Route path="/sitemap.xml" element={<Sitemap />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin/setup" element={<Setup />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reviews"
                  element={
                    <ProtectedRoute>
                      <Reviews />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reviews/new"
                  element={
                    <ProtectedRoute>
                      <NewReview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reviews/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditReview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/customers"
                  element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/images"
                  element={
                    <ProtectedRoute>
                      <Images />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/data-quality"
                  element={
                    <ProtectedRoute>
                      <DataQuality />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
      </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
