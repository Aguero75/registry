import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <Link href="/" className={buttonVariants({ variant: "ghost", className: "mb-5 -ml-2 text-slate-600 hover:text-slate-900" })}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to public directory
        </Link>
        <form
          action={loginAction}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Administrator access</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Sign in to Registry</h1>
              <p className="mt-1 text-sm leading-5 text-slate-600">Manage registered records and protected documents.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
                className="h-11 border-slate-200 bg-white px-3 text-sm focus-visible:ring-indigo-600/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-11 border-slate-200 bg-white px-3 text-sm focus-visible:ring-indigo-600/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button type="submit" className="h-11 w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
              <LockKeyhole aria-hidden="true" className="size-4" />
              Sign in securely
            </Button>
            <p className="text-center text-xs leading-5 text-slate-500">
              Authorized administrators only. Sign-in attempts are protected.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
