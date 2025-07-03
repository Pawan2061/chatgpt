import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${geist.className} min-h-screen flex items-center justify-center bg-[#17181c]`}
    >
      {children}
    </div>
  );
}
