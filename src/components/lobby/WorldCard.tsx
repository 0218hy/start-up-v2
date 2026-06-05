import { Pressable, Text } from "react-native";

interface World {
    world_name: string;
    code: string;
}

interface WorldCardProps {
    world: World;
    onPress: () => void;
}

export default function WorldCard({ world, onPress }: WorldCardProps) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                padding: 16,
                marginBottom: 12,
                backgroundColor: "#222",
                borderRadius: 12,
            }}
        >
            <Text style={{ color: "white", fontSize: 18 }}>
                {world.world_name}
            </Text>

            <Text style={{ color: "#aaa" }}>
                ID: {world.code}
            </Text>
        </Pressable>
    );
}