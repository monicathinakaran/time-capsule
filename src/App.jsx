// src/App.jsx

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase_client.js' // Check path

// Import all your pages
import LandingPage from './Pages/LandingPage.jsx' // Import the new page
import Login from './Pages/Login.jsx'
import SignUp from './Pages/SignUp.jsx'
import Dashboard from './Pages/Dashboard.jsx'

function App() {
  const [session, setSession] = useState(null)
  
  // This state is to prevent a "flash" of the login page
  const [loading, setLoading] = useState(true) 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false) // Done checking for session
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show a blank page while we check for a session
  if (loading) {
    return null 
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/signup" 
          element={!session ? <SignUp /> : <Navigate to="/dashboard" />} 
        />
        
        {/* Protected Route */}
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App