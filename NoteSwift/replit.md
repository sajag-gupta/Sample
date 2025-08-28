# NoteTaker Application

## Overview

NoteTaker is a full-stack web application for personal note management. Built with React on the frontend and Express.js on the backend, it provides a clean, modern interface for creating, managing, and organizing personal notes. The application features secure user authentication with email verification, Google OAuth integration, and a responsive design using Tailwind CSS and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the entire stack
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Email Service**: Nodemailer for OTP verification emails
- **API Design**: RESTful API with proper error handling and logging middleware

### Database & ORM
- **Database**: PostgreSQL using Neon serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

### Authentication System
- **Primary Authentication**: Email/password with JWT tokens
- **Email Verification**: OTP-based email verification system
- **OAuth Integration**: Google OAuth for social login
- **Security**: Secure password hashing, token-based sessions, and protected routes

### Development Environment
- **Monorepo Structure**: Shared types and schemas between frontend and backend
- **Hot Reload**: Vite middleware integration for seamless development
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)
- **Error Handling**: Runtime error overlays and comprehensive error boundaries

## External Dependencies

### Core Frameworks & Libraries
- **React Ecosystem**: React 18, React DOM, React Hook Form, TanStack Query
- **Backend**: Express.js, Node.js TypeScript runtime (tsx)
- **Database**: Neon serverless PostgreSQL, Drizzle ORM
- **Authentication**: jsonwebtoken, bcrypt, google-auth-library

### UI & Styling
- **Component Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts (Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono)

### Email Services
- **Email Provider**: Nodemailer for SMTP-based email delivery
- **OTP Generation**: Custom OTP generation for email verification

### Development Tools
- **Build Tools**: Vite, esbuild for production builds
- **Type Safety**: TypeScript, Zod for runtime validation
- **Code Quality**: ESLint integration, TypeScript strict mode
- **Development**: Replit-specific plugins for enhanced development experience

### Third-party Integrations
- **Google OAuth**: Google authentication for social login
- **SMTP Services**: Email delivery through configurable SMTP providers
- **Database Hosting**: Neon serverless PostgreSQL for scalable data storage