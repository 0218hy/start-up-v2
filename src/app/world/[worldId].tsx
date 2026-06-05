import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber/native"; 
import { supabase } from "@/lib/supabase"; // Adjust this path to your client setup

import Campfire from "../../components/Campfire";
import Player from "../../components/Player";

export default function WorldPage() {
  const worldId = "lobby"; 

  useEffect(() => {
    const channel = supabase.channel(`world-${worldId}`);
  
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Connected to room: world-${worldId}`);
      }
    });
  
    return () => {
      channel.unsubscribe();
    };
  }, [worldId]); // Added worldId to dependency array so it safely reconnects if it changes

  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.7} />

      <Player />
      <Campfire />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </Canvas>
  );
}
