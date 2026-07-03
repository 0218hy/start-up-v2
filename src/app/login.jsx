import { useState, useEffect } from "react";
import { Image, StyleSheet, TextInput, View, Text, Alert, TouchableOpacity } from "react-native";
import { supabase } from "../lib/supabase";
import NookletLoading from "../components/nooklet/NookletLoading";
import NookletPage from "../components/nooklet/NookletPage";

const nookletLogo = require("../assets/images/nooklet/nooklet_logo.png");

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Live validation states
    const [usernameError, setUsernameError] = useState("");
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    // ⏱️ Live Username Validation Effect (Debounced)
    useEffect(() => {
        if (!username.trim()) {
            setUsernameError("");
            return;
        }

        setIsCheckingUsername(true);

        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("username", username.trim())
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setUsernameError("❌ This username is already taken");
                } else {
                    setUsernameError("✅ Username is available!");
                }
            } catch (err) {
                console.error("Live check failed:", err.message);
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [username]);

    // 🔑 Log In Using Username + Password 
    async function signIn() {
        if (!username.trim() || !password) {
            return Alert.alert("Error", "Please fill in all fields");
        }
        setLoading(true);
        
        try {
            // Derive the predictable dummy email from the username
            const derivedEmail = `${username.trim().toLowerCase()}@yourgame.local`;

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: derivedEmail,
                password,
            });

            if (authError) throw authError;

        } catch (error) {
            const msg = error.message.includes("Invalid login credentials") 
                ? "Incorrect username or password." 
                : error.message;
            Alert.alert("Login Failed", msg);
        } finally {
            setLoading(false);
        }
    }

    // 📝 Register Using Username + Password
    async function signUp() {
        if (!username.trim() || !password) {
            return Alert.alert("Error", "Please fill in all fields");
        }
        if (usernameError.includes("taken")) {
            return Alert.alert("Error", "Please fix form errors before submitting");
        }

        setLoading(true);

        try {
            const dummyEmail = `${username.trim().toLowerCase()}@yourgame.local`;

            const { data, error: authError } = await supabase.auth.signUp({
                email: dummyEmail,
                password,
            });

            if (authError) throw authError;

            const user = data.user;
            if (!user) {
                setLoading(false);
                return;
            }

            // Matches your columns: inserts only 'id' and 'username'
            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id,
                    username: username.trim(),
                });

            if (profileError) throw profileError;

            Alert.alert("Success", "Account created and logged in!");

        } catch (error) {
            Alert.alert("Registration Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <NookletLoading message="Opening your character..." />;
    }

    return (
        <NookletPage contentStyle={styles.pageContent}>
            <Image source={nookletLogo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>
                Nooklet
            </Text>

            <TextInput
                placeholder="Username"
                placeholderTextColor="#9A3412"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={styles.input}
            />
            {isCheckingUsername && <Text style={{ color: 'gray', fontSize: 12, marginTop: 4 }}>Checking availability...</Text>}
            {!isCheckingUsername && usernameError ? (
                <Text style={{ 
                    color: usernameError.includes("❌") ? 'red' : 'green', 
                    fontSize: 12, 
                    marginTop: 4,
                    marginBottom: 10 
                }}>
                    {usernameError}
                </Text>
            ) : <View style={{ height: 20 }} />}

            <TextInput
                placeholder="Password"
                placeholderTextColor="#9A3412"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                style={styles.input}
            />

            <TouchableOpacity activeOpacity={0.85} style={[styles.button, styles.loginButton]} onPress={signIn}>
                <Text style={styles.buttonTextLight}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.button, styles.registerButton, usernameError.includes("❌") && styles.disabledButton]}
                onPress={signUp}
                disabled={usernameError.includes("❌")}
            >
                <Text style={styles.buttonTextDark}>Register New Character</Text>
            </TouchableOpacity>
        </NookletPage>
    );
}

const styles = StyleSheet.create({
    pageContent: {
        justifyContent: "center",
    },
    logo: {
        width: "100%",
        maxWidth: 480,
        height: 220,
        maxHeight: "40%",
        alignSelf: "center",
        marginBottom: 6,
    },
    title: {
        fontFamily: "SuperJoyful",
        color: "#431407",
        fontSize: 34,
        marginBottom: 20,
        textAlign: "center",
    },
    input: {
        height: 54,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#FDBA74",
        backgroundColor: "rgba(255,255,255,0.9)",
        color: "#431407",
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 14,
    },
    button: {
        height: 56,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        marginTop: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    loginButton: {
        backgroundColor: "#EA580C",
        borderColor: "#9A3412",
        shadowColor: "#9A3412",
    },
    registerButton: {
        backgroundColor: "#FEF08A",
        borderColor: "#CA8A04",
        shadowColor: "#CA8A04",
    },
    disabledButton: {
        opacity: 0.55,
    },
    buttonTextLight: {
        fontFamily: "SuperJoyful",
        color: "#FFFFFF",
        fontSize: 18,
    },
    buttonTextDark: {
        fontFamily: "SuperJoyful",
        color: "#431407",
        fontSize: 18,
    },
});
