"use client";

import type { FormEvent } from "react";
import { SignInPage } from "@/components/ui/sign-in";

export default function AnmeldenPage() {
  const handleSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="dark min-h-screen bg-[#050505] text-foreground">
      <SignInPage
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        onSignIn={handleSignIn}
        onGoogleSignIn={() => {}}
        onResetPassword={() => {}}
        onCreateAccount={() => {}}
      />
    </div>
  );
}
