import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore"; 
import { supabase } from "@/lib/supabase";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "SuperJoyful": require("../assets/fonts/SuperJoyful.ttf"), // Map path to font location
  });

  const { user, loading, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Synchronize Supabase authentication state with the Zustand Store
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  // 2. Route Protection Middleware layer
  useEffect(() => {
    if (loading) return; 
    
    // Check if user is currently on the root index page
    const isAtRoot = segments.length === 0 || segments[0] === "";
    const inAuthGroup = segments.includes("(auth)") || segments.includes("login");

    if (!user) {
      // If not logged in, force them to login from ANY screen (including root)
      if (!inAuthGroup || isAtRoot) {
        router.replace("/login");
      }
    } else {
      // If logged in, redirect them to the lobby from login screens or the root splash
      if (inAuthGroup || isAtRoot) {
        router.replace("/lobby");
      }
    }
  }, [user, loading, segments, router]);

  return <Slot />;
}
