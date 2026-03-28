"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Stethoscope } from "lucide-react";
import styles from "@/styles/pages/Auth.module.css";
import { useAuth } from "@/context/AuthContext";

function DoctorLoginInner() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginCounsellor, isLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.role === "counsellor") {
      router.push("/doctor");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setError("Registration successful! Please log in.");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await loginCounsellor(formData.email, formData.password);
      if (!response.success) {
        setError(response.message || "Login failed. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during login.");
    }
  };

  return (
    <Layout title="Doctor Login - Sehat-Saathi" description="Doctor/Counsellor sign-in portal">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Stethoscope size={36} color="#059669" />
            </div>
            <h1 className={styles.title}>Doctor Portal</h1>
            <p className={styles.subtitle}>Sign in to access your patient dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <div className={styles.inputContainer}>
                <Mail size={20} className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.inputContainer}>
                <Lock size={20} className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorMessage} style={
                searchParams.get("registered") === "true" ? { color: "#059669", background: "#ecfdf5", borderColor: "#a7f3d0" } : undefined
              }>
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  Sign In <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className={styles.authFooter}>
            <p className={styles.footerText}>
              Don&apos;t have an account?{" "}
              <Link href="/register-doctor" className={styles.footerLink}>
                Register as a Doctor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function DoctorLoginPage() {
  return (
    <Suspense fallback={null}>
      <DoctorLoginInner />
    </Suspense>
  );
}
