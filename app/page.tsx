import Home from "@/components/homepage";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
export default async function HomePage() {
  const user = await currentUser();
  console.log(user, "user is here ");
  if (!user) {
    redirect("/sign-in");
  }
  return (
    <>
      <Home />
    </>
  );
}
