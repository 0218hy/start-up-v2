import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import WorldCard from "../components/lobby/WorldCard";
import { supabase } from "../lib/supabase";

// 1. Define the relationship structure coming back from Supabase
interface WorldMemberRow {
    world_id: number;
    worlds: {
        id: string;
        world_name: string;
        code: string;
    } | null;
}

export default function Landing() {
    const [worlds, setWorlds] = useState<WorldMemberRow[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const user = useAuthStore((state) => state.user);

    async function loadWorlds() {
        if (!user) return;

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("world_members")
                .select(`
          world_id,
          worlds (
            id,
            world_name,
            code
          )
        `)
                .eq("player_id", user.id);
            if (error) throw error;

            // Cast the raw query payload to our typed structural array interface
            setWorlds((data as unknown as WorldMemberRow[]) || []);
        } catch (err) {
            console.error("Failed loading user worlds:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadWorlds();
    }, [user]);

    // 3. Render a clean loading interface while network requests resolve
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Your Worlds</Text>

            {worlds.map((w) => {
                if (!w.worlds) return null;

                return (
                    <WorldCard
                        key={w.world_id}
                        world={w.worlds}
                        onPress={() => router.push(`/world/${w.worlds!.id}`)}
                    />
                );
            })}

            <View style={{ marginTop: "auto", gap: 12 }}>
                <Button title="Create World" onPress={() => router.push("/create_world")} color="#38bdf8" />
                <Button title="Join World" onPress={() => router.push("/join_world")} color="#38bdf8" />
                <Button
                    title="Sign Out"
                    onPress={async () => await supabase.auth.signOut()}
                    color="#ef4444"
                />
            </View>
        </View>
    );
}
