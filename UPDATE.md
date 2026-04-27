Role: You are an Expert Full-Stack System Architect and UI/UX Designer specializing in B2B SaaS platforms and multi-tenant applications.

Context: We are building "ConFix," an AI-powered infrastructure monitoring, issue reporting, and safety platform. We need to overhaul our Role-Based Access Control (RBAC), multi-tenant onboarding, and field-worker reporting flows to be highly efficient and secure.

Task: Based on the requirements below, provide a comprehensive architecture breakdown, including database models, authentication flows, and UI layout structures.

Core Requirements:

1. Worker "New Report" UI (Maximal Minimalism):

Auto-filled Context: The user's Role (e.g., Electrician), Team, Name, Asset Name, and Location must be implicitly tied to their profile and the specific asset they are assigned to. These fields should not be visible or editable in the creation form to save time.

User Input Fields: The "Issue Detail" screen should strictly contain:

Description (Text area).

Image Section (Gallery view of attached photos).

Native Camera Button (To take real-time photos directly in the app).

2. Authentication & Role-Based Access Control (RBAC):

Worker Level: Workers do not sign up. They log in using a unique 5-digit ID and a password provided by their Company Admin.

Admin Level (Tenant Manager): Admins manage their specific company. They have strict data isolation (can only see their own company's reports, assets, and workers). Admins have the authority to create worker accounts, generate 5-digit IDs, and change a worker's position/role within the company.

Superadmin Level (System Owner): Superadmins manage the entire platform. They create Admin accounts and handle the company approval pipeline.

3. Company Onboarding Flow:

New companies will use a specific "Company Registration" page.

Upon submission, the registration enters a "Pending" state and a notification is sent to the Superadmin.

The Superadmin reviews the request. If approved, the initial Admin account for that company is generated and provisioned.

Deliverables Required:

Database Schema (JSON/Prisma): Define the relational models for Superadmin, Company, Admin, Worker, and Report to ensure strict multi-tenant data isolation.

UI/UX Wireframe Outline: Detail the components of the minimalist "New Report" mobile screen.

Step-by-Step Logic Flow: Map out the exact sequence for the "Company Registration -> Superadmin Approval -> Admin creates Worker" pipeline.