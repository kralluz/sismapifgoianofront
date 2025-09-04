import { useState } from 'react'
import CampusMapMVP from './CampusMap'
import Login from './components/Login'
import './App.css'

function App() {
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const handleAdminLogin = (userToken: string, userData: any) => {
    setIsAdmin(true)
    setShowAdminLogin(false)
    localStorage.setItem('adminToken', userToken)
    localStorage.setItem('adminUser', JSON.stringify(userData))
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
  }

  if (showAdminLogin) {
    return <Login onLogin={handleAdminLogin} />
  }

  return (
    <div className='App'>
      <CampusMapMVP 
        isAdmin={isAdmin} 
        onShowAdminLogin={() => setShowAdminLogin(true)}
        onAdminLogout={handleAdminLogout}
      />
    </div>
  )
}

export default App
