import React, { useRef } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import { usePlayerStore } from "../stores/playerStore";

const JOYSTICK_SIZE = 100;
const KNOB_SIZE = 40;
const MAX_RADIUS = JOYSTICK_SIZE / 2;
const MOVE_INTERVAL_MS = 320;

export default function Controls() {
  const move = usePlayerStore((s) => s.move);
  const pan = useRef(new Animated.ValueXY()).current;
  const moveInterval = useRef(null);

  // Smooth tracker to map angular vector sweeps down to directional triggers
  const handleJoystickMove = (x, z) => {
    if (Math.abs(x) < 10 && Math.abs(z) < 10) {
      clearInterval(moveInterval.current);
      moveInterval.current = null;
      return;
    }

    let direction = "";
    if (Math.abs(x) > Math.abs(z)) {
      direction = x > 0 ? "right" : "left";
    } else {
      direction = z > 0 ? "down" : "up";
    }

    // Clear old loop timings and create a continuous movement stream while dragging
    if (!moveInterval.current) {
      move(direction);
      moveInterval.current = setInterval(() => {
        move(direction);
      }, MOVE_INTERVAL_MS);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        let { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Constrain the visual knob inside the bounding outer ring area
        if (distance > MAX_RADIUS) {
          dx = (dx / distance) * MAX_RADIUS;
          dy = (dy / distance) * MAX_RADIUS;
        }

        pan.setValue({ x: dx, y: dy });
        handleJoystickMove(dx, dy);
      },
      onPanResponderRelease: () => {
        clearInterval(moveInterval.current);
        moveInterval.current = null;
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.joystickContainer}>
      <View style={styles.outerRing} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.knob,
            {
              transform: pan.getTranslateTransform(),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  joystickContainer: {
    position: "absolute",
    bottom: 40,
    right: 24,
    zIndex: 99,
  },
  outerRing: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
});
