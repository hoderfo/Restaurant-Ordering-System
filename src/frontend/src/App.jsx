import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'
import { useOrderStore } from './store/useOrderStore'
import { connectSocket, disconnectSocket } from './config/socket.config'
import { Loader } from 'lucide-react'

// Layouts and Core Pages (Static)
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import Dashboard from './pages/dashboard/Dashboard'
import AdminLayout from './pages/Admin/AdminLayout'
import DashboardHome from './pages/dashboard/page/DashboardHome'

// Dashboard Pages (Static for POS speed)
import OrderPage from './pages/dashboard/page/OrderPage'
import ManageTables from './pages/dashboard/page/ManageTables'
import Inventory from './pages/dashboard/page/Inventory'
import Dishes from './pages/dashboard/page/Dishes'
import Customer from './pages/dashboard/page/Customer'
import KitchenDashboard from './pages/dashboard/page/KitchenDashboard'

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/Admin/pages/AdminDashboard'));
const MenuManagement = lazy(() => import('./pages/Admin/pages/MenuManagement'));
const AddCategory = lazy(() => import('./pages/Admin/pages/AddCategory'));
const AddMenu = lazy(() => import('./pages/Admin/pages/AddMenu'));
const AdminTables = lazy(() => import('./pages/Admin/pages/AdminTables'));
const ManageInventory = lazy(() => import('./pages/Admin/pages/ManageInventory'));
const AdminReports = lazy(() => import('./pages/Admin/pages/AdminReports'));
const StaffManagement = lazy(() => import('./pages/Admin/pages/StaffManagement'));
const CustomerHistory = lazy(() => import('./pages/Admin/pages/CustomerHistory'));


import { Toaster } from 'sonner';

const PageLoader = () => (
  <div className="w-full h-[60vh] flex justify-center items-center">
    <Loader className="animate-spin size-10 text-cyan-500" />
  </div>
);

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const { setupSocketListeners, cleanupSocketListeners } = useOrderStore();

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Manage Socket.io connection based on auth state
  React.useEffect(() => {
    if (authUser) {
      connectSocket();
      setupSocketListeners();
    } else {
      cleanupSocketListeners();
      disconnectSocket();
    }

    return () => {
      cleanupSocketListeners();
      disconnectSocket();
    };
  }, [authUser, setupSocketListeners, cleanupSocketListeners]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // console.log(authUser)

  // console.log(authUser)

  if (isCheckingAuth) {
    return <div className='w-full h-screen flex justify-center items-center'><Loader className="animate-spin size-20 text-cyan-500" /></div>
  }
  return (
    <>
      <Routes>

        <Route
          path="/login"
          element={!authUser ? <Login /> : <Navigate to={authUser.role === 'admin' ? "/admin" : "/"} />}
        />
        <Route
          path="/signup"
          element={!authUser ? <Signup /> : <Navigate to={authUser.role === 'admin' ? "/admin" : "/"} />}
        />


        <Route path="/" element={authUser ? <Dashboard /> : <Navigate to="/login" />} >
          <Route index element={
            authUser?.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="dashboard" />
          } />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="orders" element={<OrderPage />} />
          <Route path="tables" element={<ManageTables />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="dishes" element={<Dishes />} />
          <Route path="customers" element={<Customer />} />
          <Route path="kitchen" element={<KitchenDashboard />} />
        </Route>

        <Route path='/admin' element={authUser && authUser.role === 'admin' ? <AdminLayout /> : <Navigate to={authUser ? "/" : "/login"} />} >
          <Route index element={
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          } />
          <Route path="/admin/menu" element={
            <Suspense fallback={<PageLoader />}>
              <MenuManagement />
            </Suspense>
          } />
          <Route path="/admin/add-category" element={
            <Suspense fallback={<PageLoader />}>
              <AddCategory />
            </Suspense>
          } />
          <Route path="/admin/add-menu" element={
            <Suspense fallback={<PageLoader />}>
              <AddMenu />
            </Suspense>
          } />
          <Route path="/admin/tables" element={
            <Suspense fallback={<PageLoader />}>
              <AdminTables />
            </Suspense>
          } />
          <Route path="/admin/inventory" element={
            <Suspense fallback={<PageLoader />}>
              <ManageInventory />
            </Suspense>
          } />
          <Route path="/admin/reports" element={
            <Suspense fallback={<PageLoader />}>
              <AdminReports />
            </Suspense>
          } />
          <Route path="/admin/staff" element={
            <Suspense fallback={<PageLoader />}>
              <StaffManagement />
            </Suspense>
          } />
          <Route path="/admin/customer-history" element={
            <Suspense fallback={<PageLoader />}>
              <CustomerHistory />
            </Suspense>
          } />
        </Route>

      </Routes>

      <Toaster position="top-right" richColors expand={false} duration={3000} closeButton />
    </>
  )
}

export default App