import { Button, View } from "react-native";
import { usePlayerStore } from "../stores/playerStore";

export default function Controls() {
  const move = usePlayerStore((s) => s.move);

  return (
    <View style={{ position: "absolute", bottom: 40, alignSelf: "center" }}>

      <Button title="▲" onPress={() => move("up")} />

      <View style={{ flexDirection: "row" }}>
        <Button title="◀" onPress={() => move("left")} />
        <View style={{ width: 40 }} />
        <Button title="▶" onPress={() => move("right")} />
      </View>

      <Button title="▼" onPress={() => move("down")} />

    </View>
  );
}