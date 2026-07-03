// src/app/index.tsx
import NookletLoading from "../components/nooklet/NookletLoading";

export default function IndexPage() {
  // This acts as a loading splash screen while your _layout.tsx middleware checks Supabase auth
  return <NookletLoading message="Opening Nooklet..." />;
}
