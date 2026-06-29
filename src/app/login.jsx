import { useState, useEffect } from "react";
import { Button, Image, StyleSheet, TextInput, View, Text, Alert } from "react-native";
import { supabase } from "../lib/supabase";

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

    return (
        <View style={{ padding: 20, justifyContent: 'center', flex: 1, backgroundColor: '#111' }}>
            <Image source={nookletLogo} style={styles.logo} resizeMode="contain" />
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
                Nooklet
            </Text>

            <TextInput
                placeholder="Username"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={{ borderBottomWidth: 1, borderColor: '#444', color: '#fff', padding: 8, fontSize: 16 }}
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
                placeholderTextColor="#666"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                style={{ borderBottomWidth: 1, borderColor: '#444', color: '#fff', marginBottom: 25, padding: 8, fontSize: 16 }}
            />

            <Button
                title={loading ? "Loading..." : "Login"}
                onPress={signIn}
                disabled={loading}
                color="#38bdf8"
            />

            <View style={{ height: 12 }} />

            <Button
                title={loading ? "Loading..." : "Register New Character"}
                onPress={signUp}
                disabled={loading || usernameError.includes("❌")}
                color="#22c55e"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    logo: {
        width: "100%",
        maxWidth: 480,
        height: 220,
        maxHeight: "40%",
        alignSelf: "center",
        marginBottom: 6,
    },
});
