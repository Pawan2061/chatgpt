import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-lg">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-black hover:bg-gray-800",
              footerActionLink: "text-black hover:text-gray-800",
            },
          }}
        />
      </div>
    </div>
  );
}
