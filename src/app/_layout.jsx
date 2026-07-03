import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/stores/authStore"; 
import { supabase } from "@/lib/supabase";
import { useFonts } from "expo-font";
import NookletLoading from "../components/nooklet/NookletLoading";
import { characterStorageKey } from "../utils/characterSelection";
import { useCharacterStore } from "../stores/characterStore";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "SuperJoyful": require("../assets/fonts/SuperJoyful.ttf"), // Map path to font location
  });
  const { user, loading, setUser, setLoading } = useAuthStore();
  const {
    hasCharacter,
    loading: characterLoading,
    setHasCharacter,
    setSelectedCharacterId,
    setLoading: setCharacterLoading
  } = useCharacterStore();
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

  useEffect(() => {
    let cancelled = false;

    async function loadCharacterSelection() {
      if (!user?.id) {
        if (!cancelled) {
          setHasCharacter(false);
          setSelectedCharacterId(null);
          setCharacterLoading(false);
        }
        return;
      }

      try {
        setCharacterLoading(true);
        const storedCharacter = await AsyncStorage.getItem(characterStorageKey(user.id));
        if (!cancelled) {
          setHasCharacter(Boolean(storedCharacter));
          setSelectedCharacterId(storedCharacter);
        }
      } finally {
        if (!cancelled) {
          setCharacterLoading(false);
        }
      }
    }

    loadCharacterSelection();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // 2. Route Protection Middleware layer
  useEffect(() => {
    if (loading || characterLoading) return; 
    
    // Check if user is currently on the root index page
    const isAtRoot = segments.length === 0 || segments[0] === "";
    const inAuthGroup = segments.includes("(auth)") || segments.includes("login");
    const inCharacterSelect = segments.includes("character_select");

    if (!user) {
      // If not logged in, force them to login from ANY screen (including root)
      if (!inAuthGroup || isAtRoot) {
        router.replace("/login");
      }
    } else {
      if (!hasCharacter && !inCharacterSelect) {
        router.replace("/character_select");
        return;
      }

      // If logged in, redirect them to the lobby from login screens or the root splash
      if (inAuthGroup || isAtRoot) {
        router.replace(hasCharacter ? "/lobby" : "/character_select");
      } else if (hasCharacter && inCharacterSelect) {
        router.replace("/lobby");
      }
    }
  }, [user, loading, characterLoading, hasCharacter, segments, router]);

  if (!loaded || error || loading || characterLoading) {
    return <NookletLoading message="Opening Nooklet..." />;
  }

  return <Slot />;
}
