import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import ListingsIndex from './pages/ListingsIndex';
import ListingDetails from './pages/ListingDetails';
import NewListing from './pages/NewListing';
import EditListing from './pages/EditListing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

import Wishlist from './pages/Wishlist';
import MyBookings from './pages/MyBookings';
import PaymentSummary from './pages/PaymentSummary';
import PaymentGateway from './pages/PaymentGateway';
import PaymentSimulator from './pages/PaymentSimulator';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PrintInvoice from './pages/PrintInvoice';
import PaymentHistory from './pages/PaymentHistory';
import HostDashboard from './pages/HostDashboard';
import NotificationsHistory from './pages/NotificationsHistory';
import ChatWindow from './pages/ChatWindow';

// Toast Notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <AuthProvider>
      <Router>
        <div id="root">
          <Navbar onSearch={handleSearch} />
          
          <main className="container flex-grow-1">
            <Routes>
              {/* Home redirect */}
              <Route path="/" element={<Navigate to="/listings" />} />
              
              {/* Listings Routes */}
              <Route path="/listings" element={<ListingsIndex searchQuery={searchQuery} />} />
              <Route 
                path="/listings/new" 
                element={
                  <ProtectedRoute>
                    <NewListing />
                  </ProtectedRoute>
                } 
              />
              <Route path="/listings/:id" element={<ListingDetails />} />
              <Route 
                path="/listings/:id/edit" 
                element={
                  <ProtectedRoute>
                    <EditListing />
                  </ProtectedRoute>
                } 
              />
              
              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Wishlist Route */}
              <Route 
                path="/wishlist" 
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                } 
              />
              
              {/* Bookings Route */}
              <Route 
                path="/bookings" 
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Mock Payment Flow Routes */}
              <Route path="/bookings/payment-summary" element={<PaymentSummary />} />
              <Route path="/bookings/payment-gateway" element={<PaymentGateway />} />
              <Route path="/bookings/payment-simulator" element={<PaymentSimulator />} />
              <Route path="/bookings/payment-success" element={<PaymentSuccess />} />
              <Route path="/bookings/payment-failure" element={<PaymentFailure />} />
              <Route path="/bookings/invoice" element={<PrintInvoice />} />
              <Route 
                path="/payments" 
                element={
                  <ProtectedRoute>
                    <PaymentHistory />
                  </ProtectedRoute>
                } 
              />
              
              {/* Host Dashboard Route */}
              <Route 
                path="/host/dashboard" 
                element={
                  <ProtectedRoute>
                    <HostDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Dashboard Route */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              
              {/* Notifications and Chat Routes */}
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <NotificationsHistory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatWindow />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat/:bookingId" 
                element={
                  <ProtectedRoute>
                    <ChatWindow />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/listings" />} />
            </Routes>
          </main>

          <Footer />
        </div>
        
        {/* React Toastify container for notifications */}
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
      </Router>
    </AuthProvider>
  );
}

export default App;
