"use client";

import { SignUpPage } from "@/components/ui/sign-up";

export default function RegistrierenPage() {
  return (
    <div className="dark min-h-screen bg-[#050505] text-foreground">
      <SignUpPage
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        onGoogleSignUp={() => {}}
      />
    </div>
  );
}
