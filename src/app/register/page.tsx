"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, ArrowRight } from 'lucide-react';
import styles from '@/styles/pages/Auth.module.css';
import { useAuth } from '@/context/AuthContext';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNo: '',
    university: '',
    program: '',
    branch: '',
    semester: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { register, isLoading, isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate contact number is provided
    if (!formData.contactNo) {
      setError('Contact number is required');
      return;
    }

    // Validate contact number is a valid number
    if (isNaN(Number(formData.contactNo))) {
      setError('Contact number must be a valid number');
      return;
    }
    
    try {
      // Remove confirmPassword as it's not needed in the API call
      const { confirmPassword, ...userData } = formData;
      
      // Convert contactNo to a number as expected by the backend
      const processedUserData = {
        ...userData,
        contactNo: Number(userData.contactNo)
      };
      
      const response = await register(processedUserData);
      
      if (response.success) {
        // Redirect to login page on successful registration
        router.push('/login?registered=true');
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An error occurred during registration. Please try again.';
      console.error('Registration error:', message, err);
      setError(message);
    }
  };

  return (
    <Layout
      title="Sign Up - Sehat-Saathi"
      description="Create your Sehat-Saathi account to start your mental health journey with evidence-based interventions."
    >
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.title}>Join Sehat-Saathi</h1>
            <p className={styles.subtitle}>
              Start your mental health journey today
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName" className={styles.label}>
                  First Name
                </label>
                <div className={styles.inputContainer}>
                  <User size={20} className={styles.inputIcon} />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="First name"
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="lastName" className={styles.label}>
                  Last Name
                </label>
                <div className={styles.inputContainer}>
                  <User size={20} className={styles.inputIcon} />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
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
              <label htmlFor="contactNo" className={styles.label}>
                Contact Number
              </label>
              <div className={styles.inputContainer}>
                <User size={20} className={styles.inputIcon} />
                <input
                  type="tel"
                  id="contactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter your contact number"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            <div className={styles.universityRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="university" className={styles.label}>
                  University
                </label>
                <div className={styles.inputContainer}>
                  <GraduationCap size={20} className={styles.inputIcon} />
                  <select
                    id="university"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    <option value="">Select your university</option>
                    <option value="stanford">NIT Srinager</option>
                    <option value="harvard">Kashmir University</option>
                    <option value="mit">NIFT Srinagar</option>
                    <option value="ucla">SMVDU Katra</option>
                    <option value="berkeley">GMC Baramulla</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="program" className={styles.label}>
                  Program
                </label>
                <div className={styles.inputContainer}>
                  <GraduationCap size={20} className={styles.inputIcon} />
                  <select
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    <option value="">Select your program</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="BSc">BSc</option>
                    <option value="MSc">MSc</option>
                    <option value="BBA">BBA</option>
                    <option value="MBA">MBA</option>
                    <option value="MBBS">MBBS</option>
                    <option value="BDS">BDS</option>
                    <option value="B.Pharm">B.Pharm</option>
                    <option value="M.Pharm">M.Pharm</option>
                    <option value="B.Arch">B.Arch</option>
                    <option value="M.Arch">M.Arch</option>
                    <option value="B.Des">B.Des</option>
                    <option value="M.Des">M.Des</option>
                    <option value="PhD">PhD</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.universityRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="branch" className={styles.label}>
                  Branch
                </label>
                <div className={styles.inputContainer}>
                  <GraduationCap size={20} className={styles.inputIcon} />
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    <option value="">Select your branch</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Aerospace Engineering">Aerospace Engineering</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Fashion Design">Fashion Design</option>
                    <option value="Interior Design">Interior Design</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Economics">Economics</option>
                    <option value="Psychology">Psychology</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="semester" className={styles.label}>
                  Semester
                </label>
                <div className={styles.inputContainer}>
                  <GraduationCap size={20} className={styles.inputIcon} />
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="">Select your semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester</option>
                    <option value="4">4th Semester</option>
                    <option value="5">5th Semester</option>
                    <option value="6">6th Semester</option>
                    <option value="7">7th Semester</option>
                    <option value="8">8th Semester</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputContainer}>
                <Lock size={20} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Create a password"
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

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <div className={styles.inputContainer}>
                <Lock size={20} className={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.passwordToggle}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className={styles.authFooter}>
            <p className={styles.footerText}>
              Already have an account?{' '}
              <Link href="/login" className={styles.footerLink}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
