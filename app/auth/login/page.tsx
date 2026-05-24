'use client';

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] p-6">
      <div className="w-full max-w-[400px]">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: "bg-[#37352f] hover:bg-black text-sm font-black rounded-xl py-3",
              card: "shadow-2xl border border-[#e9e9e8] rounded-[32px] overflow-hidden",
              headerTitle: "text-2xl font-black text-[#37352f] tracking-tight",
              headerSubtitle: "text-[#acaba9] font-medium",
              socialButtonsBlockButton: "rounded-xl border-[#e9e9e8] hover:bg-[#f7f7f5] transition-all",
              formFieldInput: "rounded-xl border-[#e9e9e8] bg-[#f7f7f5] focus:bg-white transition-all",
              footerActionLink: "text-blue-600 font-bold hover:text-blue-700"
            }
          }}
        />
      </div>
    </div>
  );
}
