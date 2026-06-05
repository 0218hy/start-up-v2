import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore"; 
import { supabase } from "@/lib/supabase";

export default function RootLayout() {
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

    const typedSegments = segments as string[];
    
    // Check if user is currently on the root index page
    const isAtRoot = typedSegments.length === 0 || typedSegments[0] === "";
    const inAuthGroup = typedSegments.includes("(auth)") || typedSegments.includes("login");

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
