"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { signupSchema } from "@/lib/schemas/forms";

export default function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [step, setStep] = useState("signup");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [clerkError, setClerkError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClerkError("");
    setIsSubmitting(true);

    if (!isLoaded) {
      setIsSubmitting(false);
      return;
    }

    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => { fieldErrors[err.path[0]] = err.message; });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    const sanitizedEmail = result.data.email;

    try {
      await signUp.create({ emailAddress: sanitizedEmail, password: result.data.password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err) {
      setClerkError(err.errors?.[0]?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsVerifying(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/onboarding");
      } else {
        setClerkError("Verification incomplete. Please try again.");
      }
    } catch (err) {
      setClerkError(err.errors?.[0]?.message || "Invalid code.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">Verify Email</h2>
        <p className="text-sm text-center text-zinc-500 mb-4">Enter the code sent to {form.email}</p>
        {clerkError && <p className="text-red-500 text-sm mb-4 text-center">{clerkError}</p>}
        <form onSubmit={handleVerify} className="space-y-4">
          <label htmlFor="verification-code" className="sr-only">Verification code</label>
          <input
            id="verification-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">Create Account</h2>
      {clerkError && <p className="text-red-500 text-sm mb-4 text-center">{clerkError}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating account..." : "Sign Up"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-500 mt-4">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-indigo-500 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
