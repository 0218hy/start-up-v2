import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RevealActionButton from "../../components/chat/RevealActionButton";
import RevealModal from "../../components/chat/RevealModal";
import NookletLoading from "../../components/nooklet/NookletLoading";

export default function ChatScreen() {
    const { id: worldId } = useLocalSearchParams();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const flatListRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // --- 🗺️ TRACKERS ---
    const [mortalId, setMortalId] = useState(null);
    const [mortalName, setMortalName] = useState("your mortal");
    const [angelId, setAngelId] = useState(null);
    const [activeTab, setActiveTab] = useState("mortal");

    const [isRevealed, setIsRevealed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const hasAutoOpenedRef = useRef(false);

    useEffect(() => {
        if (!user || !worldId) return;

        let intervalId = null;

        async function startChatRoom() {
            try {
                const { data: mortalAssign } = await supabase
                    .from("angel_assignments")
                    .select("mortal_id")
                    .eq("world_id", worldId)
                    .eq("angel_id", user.id)
                    .maybeSingle();

                const { data: angelAssign } = await supabase
                    .from("angel_assignments")
                    .select("angel_id")
                    .eq("world_id", worldId)
                    .eq("mortal_id", user.id)
                    .maybeSingle();

                if (mortalAssign) {
                    setMortalId(mortalAssign.mortal_id);
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", mortalAssign.mortal_id)
                        .maybeSingle();

                    if (profile?.username) setMortalName(profile.username);
                }
                if (angelAssign) setAngelId(angelAssign.angel_id);

                await checkRevealStatus();
                await fetchChannelMessages(mortalAssign?.mortal_id, angelAssign?.angel_id, activeTab);
                setLoading(false);

                intervalId = setInterval(() => {
                    checkRevealStatus();
                    fetchChannelMessages(mortalAssign?.mortal_id, angelAssign?.angel_id, activeTab);
                }, 3000);

            } catch (err) {
                console.error("Chat fetch setup failed:", err.message);
                setLoading(false);
            }
        }

        startChatRoom();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [user, worldId, activeTab]);

    async function checkRevealStatus() {
        try {
            const { data: state } = await supabase
                .from("world_chat_states")
                .select("loop_revealed")
                .eq("world_id", worldId)
                .maybeSingle();

            if (state) {
                setIsRevealed(state.loop_revealed);

                // 🔄 FIRST TIME REVEAL DETECTION:
                // Check the current value of the Ref instead of a state variable
                if (state.loop_revealed && !hasAutoOpenedRef.current) {
                    hasAutoOpenedRef.current = true; // Set it immediately BEFORE opening the modal
                    setShowModal(true);
                }
            }
        } catch (err) {
            console.error(err.message);
        }
    }

    async function handleManualRevealTrigger() {
        try {
            const { error } = await supabase
                .from("world_chat_states")
                .update({ loop_revealed: true })
                .eq("world_id", worldId);

            if (error) throw error;

            setIsRevealed(true);
            setShowModal(true);
            hasAutoOpenedRef.current = true;
        } catch (err) {
            console.error(err.message);
        }
    }

    // 🔄 This function cleans up your UI states when the modal completely resets the backend loop
    function handleResetLoopState() {
        hasAutoOpenedRef.current = false;
        setIsRevealed(false);
        setShowModal(false);
        setMessages([]);

        router.push(`/world/${worldId}`);
    }

    async function fetchChannelMessages(currentMortal, currentAngel, tab) {
        try {
            let query = supabase.from("messages").select("*").eq("world_id", worldId);
            if (tab === "mortal" && currentMortal) {
                query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${currentMortal}),and(sender_id.eq.${currentMortal},receiver_id.eq.${user.id})`);
            } else if (tab === "angel" && currentAngel) {
                query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${currentAngel}),and(sender_id.eq.${currentAngel},receiver_id.eq.${user.id})`);
            } else { return; }

            const { data, error } = await query.order("created_at", { ascending: true });
            if (!error && data) setMessages(data);
        } catch (err) { console.error(err.message); }
    }

    async function handleSendMessage() {
        if (!newMessage.trim()) return;
        const targetReceiverId = activeTab === "mortal" ? mortalId : angelId;
        if (!targetReceiverId) return;

        const placeholderText = newMessage;
        setNewMessage("");

        const { error } = await supabase.from("messages").insert({
            world_id: worldId,
            sender_id: user.id,
            receiver_id: targetReceiverId,
            text_content: placeholderText.trim(),
        });

        if (!error) await fetchChannelMessages(mortalId, angelId, activeTab);
    }

    function renderMessageItem({ item }) {
        const isMe = item.sender_id === user.id;
        let displaySenderName = isMe
            ? (activeTab === "mortal" ? "You (Angel 👼)" : "You (Mortal 🎯)")
            : (activeTab === "mortal" ? `✨ ${mortalName} ✨` : "Secret Angel 👼");

        return (
            <View style={[styles.bubbleWrapper, isMe ? styles.alignRight : styles.alignLeft]}>
                <Text style={styles.senderLabel}>{displaySenderName}</Text>
                <View style={[styles.msgBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.bubbleText, isMe ? styles.textDark : styles.textLight]}>
                        {item.text_content}
                    </Text>
                </View>
            </View>
        );
    }

    if (loading) {
        return <NookletLoading message="Opening secret whispers..." />;
    }

    return (
        <SafeAreaView style={styles.screenWrapper} edges={["top", "bottom"]}>
            {/* HEADER SECTION */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.replace(`/world/${worldId}`)}>
                    <Text style={styles.backBtnText}>← World</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🔒 Secret Whispers</Text>
                <RevealActionButton
                    worldId={worldId}
                    isRevealed={isRevealed}
                    onRevealSuccess={handleManualRevealTrigger}
                    onOpenModalRequest={() => setShowModal(true)} // Lets them reopen the modal if they click it while unlocked
                />
            </View>

            {/* TAB SYSTEM */}
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabButton, activeTab === "mortal" && styles.activeTabActive]} onPress={() => { setMessages([]); setActiveTab("mortal"); }}>
                    <Text style={[styles.tabText, activeTab === "mortal" && styles.activeTabText]}>🎯 My Mortal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === "angel" && styles.activeTabActive]} onPress={() => { setMessages([]); setActiveTab("angel"); }}>
                    <Text style={[styles.tabText, activeTab === "angel" && styles.activeTabText]}>👼 My Angel</Text>
                </TouchableOpacity>
            </View>

            <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => String(item.id)} renderItem={renderMessageItem} contentContainerStyle={styles.listContent} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.inputSlat}>
                    <TextInput style={styles.textInputBar} placeholder={activeTab === "mortal" ? "Send a riddle to your mortal..." : "Leave a note for your protector..."} placeholderTextColor="#A16207" value={newMessage} onChangeText={setNewMessage} multiline />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}><Text style={styles.sendBtnText}>Send</Text></TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* 🎭 REVEAL MODAL */}
            <RevealModal
                visible={showModal}
                worldId={worldId}
                userId={user?.id}
                onClose={() => setShowModal(false)}
                onResetSuccess={handleResetLoopState} // 💥 Triggers layout wipeout
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screenWrapper: { flex: 1, backgroundColor: "#FFFDE6" },
    centerContainer: { flex: 1, backgroundColor: "#FFFDE6", justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 54, backgroundColor: "#FFFED5" },
    backBtn: { paddingVertical: 6 },
    backBtnText: { color: "#9A3412", fontWeight: "700", fontSize: 14 },
    headerTitle: { fontFamily: "SuperJoyful", fontSize: 18, color: "#431407" },
    tabContainer: { flexDirection: "row", backgroundColor: "#FFFED5", paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1.5, borderColor: "#FED7AA", gap: 10 },
    tabButton: { flex: 1, height: 38, borderRadius: 12, backgroundColor: "#FDE68A", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F59E0B" },
    activeTabActive: { backgroundColor: "#EA580C", borderColor: "#9A3412" },
    tabText: { color: "#78350F", fontWeight: "700", fontSize: 13 },
    activeTabText: { color: "#FFFFFF", fontFamily: "SuperJoyful" },
    listContent: { padding: 16, gap: 12 },
    bubbleWrapper: { maxWidth: "80%", marginVertical: 2 },
    alignRight: { alignSelf: "flex-end", alignItems: "flex-end" },
    alignLeft: { alignSelf: "flex-start", alignItems: "flex-start" },
    senderLabel: { fontSize: 10, fontWeight: "800", color: "#B45309", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2, paddingHorizontal: 4 },
    msgBubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5 },
    myBubble: { backgroundColor: "#FEF08A", borderColor: "#CA8A04", borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: "#EA580C", borderColor: "#9A3412", borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: 14, fontWeight: "600", lineHeight: 18 },
    textDark: { color: "#431407" },
    textLight: { color: "#FFFFFF" },
    inputSlat: { flexDirection: "row", padding: 12, backgroundColor: "#FFFED5", borderTopWidth: 1.5, borderColor: "#FED7AA", alignItems: "center", gap: 8 },
    textInputBar: { flex: 1, minHeight: 40, maxHeight: 90, backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#FED7AA", paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: "600", color: "#431407" },
    sendBtn: { height: 40, paddingHorizontal: 16, backgroundColor: "#EA580C", borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#9A3412" },
    sendBtnText: { fontFamily: "SuperJoyful", color: "#FFFFFF", fontSize: 12 }
});
