# Dayflow — Human Resource Management System (HRMS)

> *Every workday, perfectly aligned.*

Dayflow is a modern, full-stack Human Resource Management System (HRMS) built for fast-moving organizations.

It provides a centralized platform for:

- Employee onboarding and management
- Employee profiles and information
- Live attendance and presence tracking
- Systray check-in / check-out
- Leave application and HR approval workflows
- Salary structure configuration
- Automated monthly payroll generation
- Loss-of-pay (LOP) calculations based on attendance and leave
- Payslip generation and viewing
- HR reports and analytics
- Role-based access control

The application uses **React + TypeScript** for the frontend and **Supabase PostgreSQL** as the backend, with database-level security and business logic enforced through PostgreSQL RLS, functions, triggers, and Supabase Edge Functions.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#️-technology-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#️-database-setup)
- [Running the Application](#-running-the-application)
- [Production Build](#-production-build)
- [Application Workflow](#-application-workflow)
- [User Roles](#-user-roles)
- [Security](#-security)
- [Payroll Logic](#-payroll-logic)
- [Project Documentation](#-project-documentation)
- [Testing & Verification](#-testing--verification)
- [Team Ownership](#-four-person-team-ownership)
- [Development Roadmap](#-development-roadmap)

---

# ✨ Features

## 👤 Employee Management

- Employee directory
- Employee onboarding
- Automatic employee/login ID generation
- Employee search and filtering
