// src/context/AuthContext.jsx
import { createContext, useCallback, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const getProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (!error && data) {
      setProfile(data)
    }

    setLoading(false)
  }, [])

  const getSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const session = data.session

    setUser(session?.user ?? null)

    if (session?.user) {
      await getProfile(session.user.id)
    } else {
      setLoading(false)
    }
  }, [getProfile])

  useEffect(() => {
    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          await getProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [getProfile, getSession])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
