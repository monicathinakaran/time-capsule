// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase_client.js' // Use your correct path

// Import all your pages
import LandingPage from './Pages/LandingPage.jsx'
import Login from './Pages/Login.jsx'
import SignUp from './Pages/SignUp.jsx'
import Dashboard from './Pages/Dashboard.jsx' // Your original dashboard
import SharedSpace from './Pages/SharedSpace.jsx' // <-- NEW
import Inbox from './Pages/Inbox.jsx'; // <-- NEW
// We'll also add a placeholder for Settings
import Settings from './Pages/Settings.jsx' // <-- NEW (from your idea)

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true) 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return null 
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/signup" 
          element={!session ? <SignUp /> : <Navigate to="/login" />} 
        />
        
        {/* --- Protected Routes (Require Login) --- */}
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/shared" 
          element={session ? <SharedSpace session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/inbox" // <-- ADD THIS ROUTE
          element={session ? <Inbox session={session} /> : <Navigate to="/login" />} 
        />
        {/* You'll also need to create the Settings.jsx file */}
        {/* <Route 
          path="/settings" 
          element={session ? <Settings session={session} /> : <Navigate to="/login" />} 
        /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App