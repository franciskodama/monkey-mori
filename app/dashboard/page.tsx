import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto flex items-center justify-between border-b border-slate-800 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-400">Welcome, {session.user.name}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" className="border-slate-800 text-slate-300 hover:text-white">
            Log Out
          </Button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">Phase 2 Checkpoint: Success!</h2>
        <p className="text-slate-300">
          You have successfully logged in using Google OAuth. Auth.js is correctly hooked up to your Prisma database. Let's move on to setting up households!
        </p>
      </div>
    </div>
  );
}
