import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-[400px] mx-auto p-4">
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="w-12 h-12 mb-4 relative">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-1">
          Create an account
        </h1>
        <p className="text-sm text-neutral-400">
          Sign up to get started with ChatGPT
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-[#212121] border-neutral-700/50",
            headerTitle: "text-white",
            headerSubtitle: "text-neutral-400",
            socialButtonsBlockButton:
              "bg-white hover:bg-neutral-200 text-black",
            socialButtonsBlockButtonText: "text-black font-medium",
            dividerLine: "bg-neutral-700/50",
            dividerText: "text-neutral-400",
            formFieldLabel: "text-neutral-200",
            formFieldInput:
              "bg-neutral-800 border-neutral-700/50 text-white placeholder:text-neutral-400",
            formButtonPrimary:
              "bg-white hover:bg-neutral-200 text-black font-medium",
            footerActionText: "text-neutral-400",
            footerActionLink: "text-white hover:text-neutral-200",
            identityPreviewText: "text-white",
            identityPreviewEditButtonIcon: "text-neutral-400",
          },
          layout: {
            socialButtonsPlacement: "top",
            socialButtonsVariant: "blockButton",
          },
        }}
        afterSignUpUrl="/"
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
}
