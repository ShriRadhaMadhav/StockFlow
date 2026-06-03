import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { Skeleton } from '../components/ui/loading/Skeleton';
import { ProtectedRoute, PublicRoute, StoreRequiredRoute } from './guards';

const DashboardRoute = lazy(() => import('./dashboard'));
const InventoryRoute = lazy(() => import('./inventory'));
const BillsRoute = lazy(() => import('./bills'));
const BillsCreateRoute = lazy(() => import('./bills/create'));
const CustomersRoute = lazy(() => import('./customers'));
const CustomerDetailsRoute = lazy(() => import('./customers/details'));
const VendorsRoute = lazy(() => import('./vendors'));
const VendorDetailsRoute = lazy(() => import('./vendors/details'));
const PurchasesRoute = lazy(() => import('./purchases'));
const StockMovementsRoute = lazy(() => import('./stock-movements'));
const OcrImportsRoute = lazy(() => import('./ocr-imports'));
const AnalyticsRoute = lazy(() => import('./analytics'));
const PaymentsRoute = lazy(() => import('./payments'));

const LoginRoute = lazy(() => import('./auth/LoginPage'));
const RegisterRoute = lazy(() => import('./auth/RegisterPage'));
const StoreSetupRoute = lazy(() => import('./auth/StoreSetupPage'));

// Loading fallback for lazy routes
const PageLoader = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-8 w-1/4" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <StoreRequiredRoute>
          <AppLayout />
        </StoreRequiredRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardRoute />
          </Suspense>
        ),
      },
      {
        path: 'inventory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <InventoryRoute />
          </Suspense>
        ),
      },
      {
        path: 'bills',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BillsRoute />
          </Suspense>
        ),
      },
      {
        path: 'bills/create',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BillsCreateRoute />
          </Suspense>
        ),
      },
      {
        path: 'customers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustomersRoute />
          </Suspense>
        ),
      },
      {
        path: 'customers/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustomerDetailsRoute />
          </Suspense>
        ),
      },
      {
        path: 'vendors',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VendorsRoute />
          </Suspense>
        ),
      },
      {
        path: 'vendors/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VendorDetailsRoute />
          </Suspense>
        ),
      },
      {
        path: 'purchases',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PurchasesRoute />
          </Suspense>
        ),
      },
      {
        path: 'stock-movements',
        element: (
          <Suspense fallback={<PageLoader />}>
            <StockMovementsRoute />
          </Suspense>
        ),
      },
      {
        path: 'ocr-imports',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OcrImportsRoute />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AnalyticsRoute />
          </Suspense>
        ),
      },
      {
        path: 'payments',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PaymentsRoute />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <div className="p-8 text-center text-foreground-secondary">
            Page not found
          </div>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <LoginRoute />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <RegisterRoute />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/store-setup',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <StoreSetupRoute />
        </Suspense>
      </ProtectedRoute>
    ),
  },
]);
