import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import Home from './Pages/Home'
import Login from './Pages/Login'
import Signin from './Pages/Signin'
import Dashboard from './Pages/Dashboard'
import AdminPortal from './Pages/AdminPortal'
import ResetPassword from './Pages/ResetPassword'
import Booking from './Pages/Booking'
import DestinationExplorer from './Pages/DestinationExplorer'
import AIChatbot from './components/AIChatbot'

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/destinations" element={<DestinationExplorer />} />
            <Route path="/destinations/:id" element={<DestinationExplorer />} />
            <Route path="/login" element={<Login initialMode="login" />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Login initialMode="signup" />} />
            <Route path="/book" element={<Booking />} />
            <Route path="/book/:id" element={<Booking />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AIChatbot />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}