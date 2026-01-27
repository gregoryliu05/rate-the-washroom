'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { useAuth } from "../../context/authContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (error) {
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google");
      router.push("/");
    } catch (error) {
      toast.error("Google sign-in failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-4xl md:text-5xl" style={{ fontFamily: "var(--font-serif)" }}>
            Log In
          </h1>
          <p className="text-muted-foreground mt-2">
            Get back to reviewing and discovering great washrooms.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        <Card className="p-8 md:p-10 border-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              Continue with Google
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            New here?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
