"use client";
import { HomeView } from "./home-view";
import { Welcome } from "./welcome";
import { useAuth } from "@/lib/auth/provider";

export default function Page() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-dvh bg-paper" />;
  return user ? <HomeView /> : <Welcome />;
}
