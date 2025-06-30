import { ClerkProvider } from "@clerk/nextjs";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: "bg-black hover:bg-gray-800",
          footerActionLink: "text-black hover:text-gray-800",
        },
        variables: {
          colorPrimary: "black",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
