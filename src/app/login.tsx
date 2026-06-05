import { useState, useEffect } from "react";
import { Button, TextInput, View, Text, Alert } from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Live validation states
    const [usernameError, setUsernameError] = useState("");
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    // ⏱️ Live Username Validation Effect (Debounced)
    useEffect(() => {
        // Clear errors instantly if the user clears the box
        if (!username.trim()) {
            setUsernameError("");
            return;
        }

        setIsCheckingUsername(true);

        // Wait 500ms after the last keystroke before querying the DB
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
            } catch (err: any) {
                console.error("Live check failed:", err.message);
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);

        // Cleanup function clears the timer if the user types another character
        return () => clearTimeout(delayDebounceFn);
    }, [username]);


    async function signIn() {
        if (!email || !password) return Alert.alert("Error", "Please fill in all fields");
        setLoading(true);
        
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);
        if (error) Alert.alert("Login Failed", error.message);
    }

    async function signUp() {
        // Prevent registration if fields are missing or the live check failed
        if (!username || !email || !password) {
            return Alert.alert("Error", "Please fill in all fields");
        }
        if (usernameError.includes("taken")) {
            return Alert.alert("Error", "Please fix form errors before submitting");
        }

        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
            });

            if (authError) throw authError;

            const user = data.user;
            if (!user) {
                setLoading(false);
                return;
            }

            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id,
                    username: username.trim(),
                });

            if (profileError) throw profileError;

            Alert.alert("Success", "Account created and logged in!");

        } catch (error: any) {
            Alert.alert("Registration Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={{ padding: 20, justifyContent: 'center', flex: 1 }}>
            {/* Username Input with Validation Feedback */}
            <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={{ borderBottomWidth: 1, padding: 8 }}
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
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderBottomWidth: 1, marginBottom: 15, padding: 8 }}
            />

            <TextInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                style={{ borderBottomWidth: 1, marginBottom: 25, padding: 8 }}
            />

            <Button
                title={loading ? "Loading..." : "Login"}
                onPress={signIn}
                disabled={loading}
            />

            <View style={{ height: 10 }} />

            <Button
                title={loading ? "Loading..." : "Register"}
                onPress={signUp}
                disabled={loading || usernameError.includes("❌")}
            />
        </View>
    );
}
