"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAuthError } from "@/lib/auth-errors";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      if (registerRes.ok) {
        toast.success("Account created");
        window.location.assign("/dashboard");
        return;
      }

      if (registerRes.status !== 503) {
        const payload = (await registerRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = formatAuthError(
          payload?.error ?? "Could not create account.",
        );
        setError(message);
        toast.error("Sign up failed", { description: message });
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        const message = formatAuthError(signUpError.message);
        setError(message);
        toast.error("Sign up failed", { description: message });
        return;
      }

      if (!data.session) {
        const message =
          "Check your email to confirm your account, then log in.";
        setError(message);
        toast.message("Confirm your email", { description: message });
        return;
      }

      toast.success("Account created");
      window.location.assign("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="app-mesh pointer-events-none fixed inset-0" aria-hidden />
      <div
        className="marketing-grid pointer-events-none fixed inset-0 opacity-30"
        aria-hidden
      />
      <Card className="glass-panel hero-glow relative w-full max-w-md border-border/80 shadow-none">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-2xl font-medium tracking-tight">
            Create your account
          </CardTitle>
          <CardDescription>Start organizing PDFs and study tools in one place.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Sign up"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
