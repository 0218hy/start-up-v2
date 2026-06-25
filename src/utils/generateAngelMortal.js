import { supabase } from "@/lib/supabase";

export async function generateAngelMortalPairs(worldId, daysBeforeReveal) {
    try {
        // 1. Fetch all unique players who have tiles or presence in this world
        const { data: members, error: fetchError } = await supabase
            .from("world_members")
            .select("player_id")
            .eq("world_id", worldId);

        if (fetchError) throw fetchError;

        // Extract unique user IDs
        const players = [...new Set(members.map((m) => m.player_id))];

        if (players.length < 3) {
            console.warn("You need at least 3 players to start an Angel & Mortal game loop!");
            return false;
        }

        // 2. Shuffle the players array randomly (Fisher-Yates Shuffle)
        const shuffled = [...players];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Explicitly hold and swap values safely to prevent null values
            const temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }

        // 3. Form the loop assignments payload
        const assignmentsPayload = [];
        for (let i = 0; i < shuffled.length; i++) {
            const angelId = shuffled[i];
            // The mortal is the next person in line. If it's the last person, loop back to index 0.
            const mortalId = shuffled[(i + 1) % shuffled.length];

            assignmentsPayload.push({
                world_id: worldId,
                angel_id: angelId,
                mortal_id: mortalId,
            });
        }

        // 4. Wipe any old testing assignments and insert the new circular game layout
        await supabase.from("angel_assignments").delete().eq("world_id", worldId);

        const { error: insertError } = await supabase
            .from("angel_assignments")
            .insert(assignmentsPayload);

        if (insertError) throw insertError;

        // 5. CRITICAL STEP: Store the timer configuration inside the world record
        const { error: stateUpdateError } = await supabase
            .from("world_chat_states")
            .upsert({
                world_id: worldId,
                chat_started_at: new Date().toISOString(),
                days_before_reveal: daysBeforeReveal,
                loop_revealed: false,
                updated_at: new Date().toISOString()
            }, { onConflict: 'world_id' });

        if (stateUpdateError) throw stateUpdateError;
        return true;
    } catch (err) {
        console.error("🚨 Assignment Logic Error:", err.message);
        return false;
    }
}