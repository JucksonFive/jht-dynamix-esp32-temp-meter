import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Login } from './components/Login'
import { TemperatureChart } from './components/TemperatureChart'
import { fetchTemperatureData } from './services/api'

function App() {
  const [user, setUser] = useState<any>(null)
  const [data, setData] = useState([])

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [])

  useEffect(() => {
    if (user) fetchTemperatureData().then(setData)
  }, [user])

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold mb-4">JT-DYNAMIX Dashboard</h1>
      <button className="text-blue-600 underline text-sm mb-4" onClick={() => supabase.auth.signOut()}>
        Logout
      </button>
      <TemperatureChart data={data} />
    </div>
  )
}

export default App
