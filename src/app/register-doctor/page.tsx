"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Stethoscope, Phone, BookOpen, Clock } from "lucide-react";
import styles from "@/styles/pages/Auth.module.css";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/network/core/axiosInstance";

export default function RegisterDoctorPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNo: "",
    qualifications: "",
    specialization: "",
    availability: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.role === "counsellor") {
      router.push("/doctor");
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.contactNo || isNaN(Number(formData.contactNo))) {
      setError("Contact number must be a valid number");
      return;
    }

    setIsSubmitting(true);
    try {
      const specialization = formData.specialization
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await axiosInstance.post("/api/auth/signUp/counsellor", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        contactNo: Number(formData.contactNo),
        qualifications: formData.qualifications,
        specialization,
        availability: formData.availability,
        password: formData.password,
      });

      if (response.data.success) {
        router.push("/login-doctor?registered=true");
      } else {
        setError(response.data.message || "Registration failed.");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Registration failed. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Register as Doctor - Sehat-Saathi" description="Create a doctor/counsellor account">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Stethoscope size={36} color="#059669" />
            </div>
            <h1 className={styles.title}>Doctor Registration</h1>
            <p className={styles.subtitle}>Create your counsellor account</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName" className={styles.label}>First Name</label>
                <div className={styles.inputContainer}>
                  <User size={20} className={styles.inputIcon} />
                  <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={styles.input} placeholder="First name" required />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="lastName" className={styles.label}>Last Name</label>
                <div className={styles.inputContainer}>
                  <User size={20} className={styles.inputIcon} />
                  <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={styles.input} placeholder="Last name" required />
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <div className={styles.inputContainer}>
                <Mail size={20} className={styles.inputIcon} />
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} placeholder="Enter your email" required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="contactNo" className={styles.label}>Contact Number</label>
              <div className={styles.inputContainer}>
                <Phone size={20} className={styles.inputIcon} />
                <input type="tel" id="contactNo" name="contactNo" value={formData.contactNo} onChange={handleChange} className={styles.input} placeholder="Enter contact number" pattern="[0-9]*" inputMode="numeric" required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="qualifications" className={styles.label}>Qualifications</label>
              <div className={styles.inputContainer}>
                <BookOpen size={20} className={styles.inputIcon} />
                <input type="text" id="qualifications" name="qualifications" value={formData.qualifications} onChange={handleChange} className={styles.input} placeholder="e.g. PhD Clinical Psychology" required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="specialization" className={styles.label}>Specialization (comma-separated)</label>
              <div className={styles.inputContainer}>
                <Stethoscope size={20} className={styles.inputIcon} />
                <input type="text" id="specialization" name="specialization" value={formData.specialization} onChange={handleChange} className={styles.input} placeholder="e.g. Anxiety, Depression, CBT" />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="availability" className={styles.label}>Availability</label>
              <div className={styles.inputContainer}>
                <Clock size={20} className={styles.inputIcon} />
                <input type="text" id="availability" name="availability" value={formData.availability} onChange={handleChange} className={styles.input} placeholder="e.g. Mon-Fri 9am-5pm" required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.inputContainer}>
                <Lock size={20} className={styles.inputIcon} />
                <input type={showPassword ? "text" : "password"} id="password" name="password" value={formData.password} onChange={handleChange} className={styles.input} placeholder="Create a password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <div className={styles.inputContainer}>
                <Lock size={20} className={styles.inputIcon} />
                <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={styles.input} placeholder="Confirm your password" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.passwordToggle}>
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
              {isSubmitting ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  Create Account <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className={styles.authFooter}>
            <p className={styles.footerText}>
              Already have an account?{" "}
              <Link href="/login-doctor" className={styles.footerLink}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
