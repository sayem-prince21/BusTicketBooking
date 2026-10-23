import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import AdminLayout from './components/AdminLayout.jsx'

import Home from './pages/Home.jsx'
import BusSearch from './pages/BusSearch.jsx'
import SeatSelection from './pages/SeatSelection.jsx'
import GuestBooking from './pages/GuestBooking.jsx'
import BookingConfirmation from './pages/BookingConfirmation.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import MyBookings from './pages/MyBookings.jsx'
import TicketDetails from './pages/TicketDetails.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import BusManagement from './pages/BusManagement.jsx'
import BookingManagement from './pages/BookingManagement.jsx'
import CustomerManagement from './pages/CustomerManagement.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <div className="app-shell d-flex flex-column min-vh-100">
        <Navbar />
        <main className="app-main flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<BusSearch />} />
            <Route path="/seats/:busId" element={<SeatSelection />} />
            <Route path="/booking/guest" element={<GuestBooking />} />
            <Route path="/confirmation" element={<BookingConfirmation />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <ProtectedRoute>
                  <TicketDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="Admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="buses" element={<BusManagement />} />
              <Route path="bookings" element={<BookingManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App
