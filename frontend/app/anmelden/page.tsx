"use client";

import { SignInPage } from "@/components/ui/sign-in";

export default function AnmeldenPage() {
  return (
    <div className="dark min-h-screen bg-[#050505] text-foreground">
      <SignInPage
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        onGoogleSignIn={() => {}}
        onResetPassword={() => {}}
        onCreateAccount={() => {}}
      />
    </div>
  );
}
