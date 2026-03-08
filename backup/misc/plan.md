# Land Commission Admin Platform — Master Implementation Plan

> **Date:** February 22, 2026
> **Base Template:** LUNO Admin (Next.js 15 + Tailwind CSS 4 + Radix UI)
> **Target Platform:** Land Commission Job Certification & Approval System + Party Membership Portal
> **Working Directory:** `c:\Users\OS\Desktop\Land Commission\luno-admin-main`

---

## Table of Contents

1. [Project Overview & Goals](#1-project-overview--goals)
2. [Current State Analysis](#2-current-state-analysis)
3. [Architecture & Tech Stack Decisions](#3-architecture--tech-stack-decisions)
4. [Phase 1 — Foundation & Layout Overhaul](#4-phase-1--foundation--layout-overhaul)
5. [Phase 2 — Authentication System](#5-phase-2--authentication-system)
6. [Phase 3 — Admin Dashboard (Job Management)](#6-phase-3--admin-dashboard-job-management)
7. [Phase 4 — Client Portal (Job Status & Tracking)](#7-phase-4--client-portal-job-status--tracking)
8. [Phase 5 — Full 12-Step Workflow Engine](#8-phase-5--full-12-step-workflow-engine)
9. [Phase 6 — Party Membership System](#9-phase-6--party-membership-system)
10. [Phase 7 — SMS/USSD Integration Layer](#10-phase-7--smsussd-integration-layer)
11. [Phase 8 — Backend & Database](#11-phase-8--backend--database)
12. [Phase 9 — Testing, Polish & Deployment](#12-phase-9--testing-polish--deployment)
13. [File Structure (Target)](#13-file-structure-target)
14. [Implementation Priority & Timeline](#14-implementation-priority--timeline)
15. [Risk & Considerations](#15-risk--considerations)

---

## 1. Project Overview & Goals

This project merges two distinct systems into a unified, professional admin platform:

### System A — Land Commission Job Certification & Approval
A 12-step job certification workflow for land survey jobs, involving:
- **Client** (submits jobs, receives approved jobs)
- **L/S 461** — Licensed Surveyor (examines, certifies/queries jobs)
- **CSAU** — Client Service Access Unit (receives, forwards, signs out jobs)
- **SMD Examination** — Survey & Mapping Division Examination (validates standards compliance)
- **SMD Region** — Regional Office (final certification by Chief Examiner)

### System B — Party Membership & SMS Dues Platform
A membership management system with:
- USSD-based registration
- Member database (name, DOB, region, constituency, polling station, Ghana Card, Voter ID)
- SMS broadcast portal (weekly/monthly messages to members)
- Automatic airtime deduction on SMS receipt (GHC 1.50: GHC 1.00 to party + GHC 0.50 to platform)
- Terms & conditions auto-acceptance on USSD registration

### The Approach
**Use the LUNO Admin template** as the design/UI foundation — keep its beautiful sidebar, header, cards, theme settings, and 50+ UI components. **Replace the demo modal showcase content** with real functional pages for both systems.

---

## 2. Current State Analysis

### What We Keep from LUNO Admin (the template)
| Component | Status | Action |
|-----------|--------|--------|
| Sidebar navigation | ✅ Keep | Modify menu items to match our modules |
| Header (search, notifications, user profile) | ✅ Keep | Re-wire for job search, real notifications |
| Theme Settings (dark mode, RTL, font) | ✅ Keep | Keep as-is |
| Footer | ✅ Keep | Update copyright text |
| 50+ Radix UI components | ✅ Keep all | Use across new pages |
| Tailwind CSS design tokens | ✅ Keep | Extend with Land Commission brand colors |
| Layout (sidebar + main area) | ✅ Keep | Add multi-page routing |

### What We Migrate from admin.html
| Feature | Source | Target |
|---------|--------|--------|
| Create/Update Job form | admin.html | `/admin/jobs/new` page |
| Workflow Steps Editor (8 steps → 12 steps) | admin.html | `/admin/jobs/[id]/workflow` page |
| Jobs List with Edit/Delete | admin.html | `/admin/jobs` page (with Radix Table) |
| Timeline Entry Editor | admin.html | `/admin/jobs/[id]` detail page |
| Export JSON / Clear All | admin.html | Admin toolbar actions |
| localStorage persistence | admin.html | Replace with API/database |

### What We Migrate from dashboard.html
| Feature | Source | Target |
|---------|--------|--------|
| Job search with quick-search chips | dashboard.html | `/client/search` page |
| Workflow progress visualization (steps) | dashboard.html | `/client/jobs/[id]` page |
| Progress bar | dashboard.html | Reuse in both admin & client |
| Current Status card | dashboard.html | Job detail sidebar |
| Job Information card | dashboard.html | Job detail sidebar |
| Timeline | dashboard.html | Job detail page |
| Download Report button | dashboard.html | PDF generation feature |

### What We Migrate from register.html
| Feature | Source | Target |
|---------|--------|--------|
| Registration form (all fields) | register.html | `/auth/register` page |
| Account type selector | register.html | Keep (Individual/Institution) |
| Ghana-specific fields (Ghana Card, +233) | register.html | Keep and expand |

### What We Migrate from index.html
| Feature | Source | Target |
|---------|--------|--------|
| Login modal | index.html | `/auth/login` page |
| Email + password auth | index.html | Auth system with role-based access |

---

## 3. Architecture & Tech Stack Decisions

### Frontend (Already in LUNO)
- **Next.js 15** with App Router (file-based routing)
- **React 19** with Server Components
- **Tailwind CSS 4** with design tokens
- **Radix UI** for accessible, unstyled primitives
- **React Hook Form + Zod** for form validation
- **Recharts** for analytics dashboards
- **Framer Motion** for animations
- **Lucide React** for icons

### To Add
| Package | Purpose |
|---------|---------|
| `next-auth` (or `auth.js`) | Authentication with role-based access |
| `@tanstack/react-table` | Advanced data tables for jobs, members |
| `@tanstack/react-query` | Server state management, caching |
| `jspdf` + `html2canvas` | PDF report generation |
| `date-fns` | Date formatting (Ghanaian locale) |
| `xlsx` or `papaparse` | Excel/CSV import for member data |
| `zustand` (lightweight) | Client state for workflow engine |

### Backend (Phase 8 — can be deferred)
- **Option A:** Next.js API Routes (simplest, monorepo)
- **Option B:** Separate Express/Fastify server
- **Database:** PostgreSQL (via Prisma ORM) or Supabase
- **SMS Gateway:** Hubtel / Arkesel / Africa's Talking (Ghana-based USSD/SMS providers)

### Routing Structure (Next.js App Router)
```
src/app/
├── (auth)/                     # Auth layout (no sidebar)
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/                # Dashboard layout (with sidebar + header)
│   ├── layout.tsx              # Shared sidebar + header wrapper
│   ├── page.tsx                # Home dashboard (overview stats)
│   ├── admin/
│   │   ├── jobs/
│   │   │   ├── page.tsx        # Jobs list (table view)
│   │   │   ├── new/page.tsx    # Create new job
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Job detail + timeline
│   │   │       └── workflow/page.tsx  # Workflow step editor
│   │   ├── users/page.tsx      # User management
│   │   └── settings/page.tsx   # System settings
│   ├── client/
│   │   ├── search/page.tsx     # Job search portal
│   │   ├── jobs/
│   │   │   └── [id]/page.tsx   # Client job tracking view
│   │   └── profile/page.tsx    # Client profile
│   ├── membership/
│   │   ├── page.tsx            # Member dashboard (stats)
│   │   ├── members/page.tsx    # Member list/database
│   │   ├── register/page.tsx   # USSD registration config
│   │   ├── sms/page.tsx        # SMS broadcast portal
│   │   └── dues/page.tsx       # Dues tracking & payments
│   └── reports/
│       └── page.tsx            # Reports & analytics
```

---

## 4. Phase 1 — Foundation & Layout Overhaul

**Goal:** Transform LUNO template from a single-page demo into a multi-page app with proper routing and role-based navigation.

### Tasks

#### 1.1. Set Up App Router with Route Groups
- Create `(auth)` route group for login/register (no sidebar)
- Create `(dashboard)` route group for main app (sidebar + header)
- Move current `page.tsx` content into `(dashboard)/page.tsx`
- Create `(dashboard)/layout.tsx` with Sidebar + Header wrapper

#### 1.2. Modify Sidebar Navigation
Replace the demo menu items with project-specific navigation:

**For Admin Role:**
```
MAIN
├── 📊 Dashboard (overview)
├── 📋 Job Management
│   ├── All Jobs
│   ├── Create New Job
│   └── Workflow Templates
├── 👥 Users & Clients
│   ├── Registered Users
│   └── Client Directory
├── 🔍 Job Search (client view preview)

MEMBERSHIP
├── 👤 Members Database
├── 📱 SMS Broadcast
├── 💰 Dues & Payments
├── 📡 USSD Configuration

SYSTEM
├── 📈 Reports & Analytics
├── ⚙️ Settings
├── 📖 Documentation
```

**For Client Role:**
```
MAIN
├── 🔍 Search Job Status
├── 📋 My Jobs
├── 👤 My Profile

SUPPORT
├── 📞 Contact Us
├── 📖 Help
```

#### 1.3. Update Header
- Replace "Allie Grater" with dynamic user name
- Wire notification bell to real notification system (later)
- Replace "Income/Expense/Revenue" sub-header with context-relevant breadcrumbs
- Keep search bar → wire to global job search

#### 1.4. Update Branding
- Replace "LUNO Admin" with "Land Commission" or your organization name
- Update footer copyright
- Add organization logo to sidebar header
- Extend Tailwind theme with brand colors (green for Land Commission, party colors for membership)

#### 1.5. Create Placeholder Pages
- Create stub `page.tsx` for each route with a heading + empty state
- Ensures routing works end-to-end before building real content

### Files to Create/Modify
```
MODIFY: src/app/layout.tsx (strip sidebar/header from root)
CREATE: src/app/(auth)/layout.tsx
CREATE: src/app/(auth)/login/page.tsx
CREATE: src/app/(auth)/register/page.tsx
CREATE: src/app/(dashboard)/layout.tsx
CREATE: src/app/(dashboard)/page.tsx
MODIFY: src/components/sections/sidebar.tsx (new menu items)
MODIFY: src/components/sections/header.tsx (dynamic user, breadcrumbs)
MODIFY: src/components/sections/footer.tsx (update copyright)
MODIFY: src/app/globals.css (add brand color tokens)
```

---

## 5. Phase 2 — Authentication System

**Goal:** Build login and registration pages using LUNO components, with role-based access control.

### Tasks

#### 2.1. Login Page (`/login`)
Migrate `index.html` login modal into a full Next.js page:
- Use Radix Dialog styling (or card layout) for centered login form
- Fields: Email, Password
- "Remember me" checkbox (Radix Checkbox)
- "Forgot Password" link
- "Sign Up" link → `/register`
- Use React Hook Form + Zod validation
- Styled with LUNO's Card, Input, Button, Checkbox components

#### 2.2. Registration Page (`/register`)
Migrate `register.html` form into Next.js:
- Account Type toggle (Individual / Institution) — Radix Radio Group
- Personal: First Name, Last Name, Middle Name, Gender
- Identification: ID Type (Select), ID Number
- Contact: Email, Country, Address, Phone (+233 prefix)
- Emergency: Contact Person, Contact Person's Phone
- Terms & Conditions checkbox
- Form validation with Zod schema
- Styled with LUNO's Field, Input, Select, RadioGroup, Button components
- Two-column responsive grid (matching register.html's layout)

#### 2.3. Role-Based Access
Define user roles:
| Role | Access |
|------|--------|
| `super_admin` | Everything |
| `admin` | Job management, users, reports |
| `csau_officer` | CSAU-related workflow steps |
| `smd_examiner` | SMD examination steps |
| `smd_regional` | SMD regional steps |
| `licensed_surveyor` | L/S 461 steps, job submission |
| `client` | Job search, own job tracking |
| `membership_admin` | Party membership module |

- Create auth context/provider
- Middleware to protect routes based on role
- Redirect unauthorized users

### Files to Create
```
CREATE: src/app/(auth)/login/page.tsx
CREATE: src/app/(auth)/register/page.tsx
CREATE: src/app/(auth)/layout.tsx
CREATE: src/lib/auth.ts (auth configuration)
CREATE: src/lib/validations/auth.ts (Zod schemas)
CREATE: src/middleware.ts (route protection)
CREATE: src/contexts/auth-context.tsx
CREATE: src/types/user.ts
```

---

## 6. Phase 3 — Admin Dashboard (Job Management)

**Goal:** Full job CRUD with the workflow engine, migrated from `admin.html` into LUNO's polished UI.

### Tasks

#### 3.1. Dashboard Home (`/dashboard`)
Overview stats cards (using Recharts):
- Total Active Jobs
- Jobs Pending Examination
- Jobs Certified This Month
- Jobs Queried (needing attention)
- Recent Activity Feed
- Workflow Bottleneck Chart (which step has most jobs stuck)
- Quick Action Buttons: "Create New Job", "Search Job"

#### 3.2. Jobs List Page (`/admin/jobs`)
Replace admin.html's simple job list with a full data table:
- Use `@tanstack/react-table` + LUNO's Table component
- Columns: Job ID, Client, Job Type, Priority, Current Step, Status, Assigned, Date, Actions
- Filters: By status (active/completed/queried), by step, by priority, by date range
- Search within table
- Bulk actions: Export selected, batch update step
- Pagination
- Click row → navigate to job detail

#### 3.3. Create/Edit Job Page (`/admin/jobs/new` & `/admin/jobs/[id]`)
Migrate admin.html's job form into LUNO components:
- **Job Information Card:**
  - Job ID (auto-generated or manual, e.g. `LS-2026-XXX`)
  - Job Type (Select: Land Survey, Parcel Plan, Site Plan, etc.)
  - Client (searchable Select from registered clients)
  - Priority (Select: Standard, High, Urgent)
  - Assigned To (Select from staff)
  - Estimated Time
  - Submitted Date (Calendar picker)
  - Parcel Size/Acreage (for payment calculation — from workflow step 7)
  - Regional Number (RN — from workflow step 2)
- **Workflow Status Card:**
  - Current Step indicator (1–12)
  - Visual step progress bar
  - Quick step advancement buttons
- **Timeline Card:**
  - Add timeline entries with label, subtext, timestamp
  - Auto-generated entries when step changes
- **Actions:**
  - Save Draft / Submit
  - Export Job Report (PDF)
  - Delete Job (admin only)

#### 3.4. Workflow Step Editor (`/admin/jobs/[id]/workflow`)
Migrate admin.html's step editor but expanded to 12 steps:
- Editable step titles and notes
- Step status computed from current step index
- Ability to add notes/comments per step
- File attachment per step (for certificates, documents)
- Assignment per step (who is responsible)
- Timestamp auto-recorded when step advances

### Files to Create
```
CREATE: src/app/(dashboard)/page.tsx (dashboard home)
CREATE: src/app/(dashboard)/admin/jobs/page.tsx
CREATE: src/app/(dashboard)/admin/jobs/new/page.tsx
CREATE: src/app/(dashboard)/admin/jobs/[id]/page.tsx
CREATE: src/app/(dashboard)/admin/jobs/[id]/workflow/page.tsx
CREATE: src/components/jobs/job-form.tsx
CREATE: src/components/jobs/job-table.tsx
CREATE: src/components/jobs/workflow-steps.tsx
CREATE: src/components/jobs/workflow-editor.tsx
CREATE: src/components/jobs/timeline.tsx
CREATE: src/components/jobs/job-stats.tsx
CREATE: src/lib/validations/job.ts (Zod schemas)
CREATE: src/types/job.ts
CREATE: src/hooks/use-jobs.ts (data fetching hook)
```

---

## 7. Phase 4 — Client Portal (Job Status & Tracking)

**Goal:** Migrate `dashboard.html` into a polished client-facing job tracking experience.

### Tasks

#### 4.1. Job Search Page (`/client/search`)
- Large search input (styled with LUNO Input + Command palette)
- Quick search chips for recent/saved job IDs
- Search results: card preview with job ID, status, last updated
- Empty state with helpful message (like dashboard.html)

#### 4.2. Client Job Detail (`/client/jobs/[id]`)
Two-column layout (like dashboard.html):
- **Left Column — Workflow Progress:**
  - 12 connected steps with done/current/todo states
  - Green dots for completed, blue for current, gray for pending
  - Connector lines between steps
  - "Current" badge on active step
  - Overall progress bar with percentage
- **Right Column — Details Sidebar:**
  - Current Status card (step X of 12, In Progress/Completed/Queried)
  - Job Information card (ID, Type, Client, Submitted, Priority, RN)
  - Timeline card (chronological activity log)
  - Action buttons: Download Report (PDF), Contact Support

#### 4.3. Client Profile (`/client/profile`)
- View/edit personal information
- View submitted jobs history
- Notification preferences

### Files to Create
```
CREATE: src/app/(dashboard)/client/search/page.tsx
CREATE: src/app/(dashboard)/client/jobs/[id]/page.tsx
CREATE: src/app/(dashboard)/client/profile/page.tsx
CREATE: src/components/client/job-search.tsx
CREATE: src/components/client/workflow-progress.tsx
CREATE: src/components/client/job-detail-sidebar.tsx
CREATE: src/components/client/progress-bar.tsx
```

---

## 8. Phase 5 — Full 12-Step Workflow Engine

**Goal:** Implement the complete certification workflow as described in the handwritten notes and team chats.

### The 12 Steps (Expanded from the 8-step demo)

| Step | Flow | Description | Responsible |
|------|------|-------------|-------------|
| 1 | Client → System | **Job Request Received** — Client submits RN request | Client |
| 2 | System → Client | **Regional Number Issued** — RN acquired and sent to client | Admin/System |
| 3 | Client → L/S 461 | **Job Plan / Production** — Planning and preparation for job production | Client / Licensed Surveyor |
| 4 | L/S 461 → System | **Job Submitted to L/S 461** — Completed job sent for assessment | Licensed Surveyor |
| 5 | L/S 461 | **Examination by L/S 461** — L/S 461 examines the job | Licensed Surveyor |
| 6 | L/S 461 | **Certification Decision** — Certified ✅ or Queried ❌ | Licensed Surveyor |
| 7 | L/S 461 → CSAU | **Submitted to CSAU for Payment** — Based on size/acreage of parcel | CSAU Officer |
| 8 | CSAU → SMD | **Forwarded to SMD Examination** — CSAU forwards job | CSAU Officer |
| 9 | SMD Examination | **SMD Examination & Validation** — Standards compliance check | SMD Examiner |
| 10 | SMD → Region | **Final Certification** — Certified by Chief Examiner, batched to Region | SMD Regional / Chief Examiner |
| 11 | CSAU | **Signing Out at CSAU** — Job officially signed out | CSAU Officer |
| 12 | Client | **Collection / Delivery** — Approved job collected or sent to client | Client / Admin |

### Workflow Engine Features
- **State machine:** Each job has a `currentStep` (1–12) and `status` per step (pending/active/completed/queried)
- **Branching at Step 6:** If queried → job returns to step 3 (re-production). If certified → proceeds to step 7
- **Auto-timestamps:** Moving to next step records date/time and user
- **Comments/Notes:** Each step can have admin notes, queries, or client messages
- **File Attachments:** Upload survey plans, certificates, payment receipts per step
- **Notifications:** Email/SMS alerts when job advances to next step
- **Audit Trail:** Full history of all changes, who made them, when

### Files to Create
```
CREATE: src/lib/workflow-engine.ts (state machine logic)
CREATE: src/types/workflow.ts (types for steps, statuses)
CREATE: src/components/workflow/workflow-stepper.tsx
CREATE: src/components/workflow/step-detail-panel.tsx
CREATE: src/components/workflow/query-dialog.tsx
CREATE: src/components/workflow/advance-step-dialog.tsx
CREATE: src/hooks/use-workflow.ts
```

---

## 9. Phase 6 — Party Membership System

**Goal:** Build the membership management module with database, SMS capabilities, and dues tracking.

### Tasks

#### 6.1. Members Database Page (`/membership/members`)
- Data table of all registered members
- Columns: Name, DOB, Region, Constituency, Polling Station, Ghana Card, Voter ID, Phone, Registration Date, Dues Status
- Import from Excel/CSV (existing member data)
- Export to Excel/CSV
- Filters: By region, constituency, polling station, dues status
- Search by name, phone, ID number
- Bulk actions: Send SMS, export, deactivate

#### 6.2. SMS Broadcast Portal (`/membership/sms`)
- **Message Composer:**
  - Large text area for typing message
  - Character count (SMS limit: 160 chars/segment)
  - Preview of how SMS will appear
  - Template library (save reusable messages)
- **Recipient Selection:**
  - All members (default)
  - Filter by region, constituency, polling station
  - Custom selection from member list
- **Scheduling:**
  - Send immediately
  - Schedule for later (date/time picker)
  - Recurring: Weekly / Monthly / Custom
- **History:**
  - Table of sent messages: date, message preview, recipient count, delivery rate, dues collected
- **Cost Calculator:**
  - Show estimated cost: recipients × GHC 1.50
  - Breakdown: GHC 1.00 to party, GHC 0.50 to platform

#### 6.3. Dues Tracking (`/membership/dues`)
- Dashboard cards:
  - Total Dues Collected (This Month / This Year / All Time)
  - Platform Fees Deducted
  - Net Revenue to Party
  - Active Paying Members vs Total Members
- Dues history table: Member Name, Phone, Amount, Date, SMS that triggered it
- Charts: Monthly dues trend, regional breakdown
- Export financial reports

#### 6.4. USSD Registration Config (`/membership/register`)
- View USSD code configuration (e.g., *XXX#)
- Registration flow preview (what the user sees at each USSD step)
- Terms & Conditions management (edit what users auto-accept)
- Registration analytics: New registrations per day/week/month, by region
- Recent registrations feed

#### 6.5. Member Profile Page (`/membership/members/[id]`)
- Full personal details
- Registration method (USSD / manual import)
- Dues payment history
- SMS receipt history
- Status: Active / Inactive / Suspended

### Files to Create
```
CREATE: src/app/(dashboard)/membership/page.tsx (membership dashboard)
CREATE: src/app/(dashboard)/membership/members/page.tsx
CREATE: src/app/(dashboard)/membership/members/[id]/page.tsx
CREATE: src/app/(dashboard)/membership/sms/page.tsx
CREATE: src/app/(dashboard)/membership/dues/page.tsx
CREATE: src/app/(dashboard)/membership/register/page.tsx
CREATE: src/components/membership/member-table.tsx
CREATE: src/components/membership/sms-composer.tsx
CREATE: src/components/membership/dues-dashboard.tsx
CREATE: src/components/membership/import-dialog.tsx
CREATE: src/lib/validations/member.ts
CREATE: src/types/member.ts
CREATE: src/hooks/use-members.ts
```

---

## 10. Phase 7 — SMS/USSD Integration Layer

**Goal:** Connect to Ghana-based SMS/USSD providers for real functionality.

### Recommended Providers (Ghana)
1. **Hubtel** — SMS + USSD + Payment APIs (most mature in Ghana)
2. **Arkesel** — Bulk SMS with competitive pricing
3. **Africa's Talking** — SMS + USSD + Airtime (pan-African)

### Integration Tasks

#### 7.1. SMS Gateway Integration
- API wrapper for sending bulk SMS
- Delivery status webhooks (track which SMS delivered)
- Rate limiting and queue management
- Cost tracking

#### 7.2. USSD Integration
- USSD session handler (multi-step registration flow)
- Webhook endpoint to receive USSD interactions
- Registration flow:
  ```
  *XXX# → Welcome to [Party Name]. Press:
  1. Register as new member
  2. Check membership status

  [If 1] → Enter your full name:
  [User types name] → Enter Ghana Card number:
  [User types ID] → Select Region: 1. Greater Accra 2. Ashanti ...
  [User selects] → Select Constituency: ...
  → You have been registered. You accept the Terms & Conditions.
    Dues: GHC 1.50 per SMS received. Welcome!
  ```

#### 7.3. Airtime Deduction (Premium SMS)
- Set up premium SMS shortcode (requires carrier agreement)
- Configure deduction: GHC 1.50 per received SMS
- Revenue split: GHC 1.00 to party account, GHC 0.50 to platform
- Payment reconciliation system

### Files to Create
```
CREATE: src/lib/sms/provider.ts (abstract SMS provider interface)
CREATE: src/lib/sms/hubtel.ts (Hubtel implementation)
CREATE: src/lib/sms/arkesel.ts (Arkesel implementation)
CREATE: src/lib/ussd/handler.ts (USSD session handler)
CREATE: src/app/api/sms/send/route.ts (API endpoint)
CREATE: src/app/api/sms/webhook/route.ts (delivery status)
CREATE: src/app/api/ussd/route.ts (USSD callback)
CREATE: src/app/api/payment/webhook/route.ts (deduction confirmation)
```

---

## 11. Phase 8 — Backend & Database

**Goal:** Replace localStorage demo with real persistence.

### Database Schema (PostgreSQL via Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  firstName     String
  lastName      String
  middleName    String?
  gender        String
  idType        String
  idNumber      String
  phone         String
  country       String   @default("Ghana")
  address       String
  role          Role     @default(CLIENT)
  contactPerson String?
  contactPhone  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  jobs          Job[]
}

model Job {
  id            String       @id @default(cuid())
  jobId         String       @unique  // LS-2026-XXX
  jobType       String
  clientId      String
  client        User         @relation(fields: [clientId], references: [id])
  priority      Priority     @default(STANDARD)
  assignedTo    String?
  estimatedTime String?
  submittedDate DateTime
  currentStep   Int          @default(1)
  status        JobStatus    @default(IN_PROGRESS)
  regionalNumber String?
  parcelSize     String?
  steps         WorkflowStep[]
  timeline      TimelineEntry[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model WorkflowStep {
  id        String     @id @default(cuid())
  jobId     String
  job       Job        @relation(fields: [jobId], references: [id])
  stepNumber Int
  title     String
  note      String?
  status    StepStatus @default(PENDING)
  assignedTo String?
  comment   String?
  completedAt DateTime?
  completedBy String?
  attachments String[]
}

model TimelineEntry {
  id        String   @id @default(cuid())
  jobId     String
  job       Job      @relation(fields: [jobId], references: [id])
  label     String
  subtext   String
  status    String
  createdAt DateTime @default(now())
  createdBy String?
}

model Member {
  id              String   @id @default(cuid())
  firstName       String
  surname         String
  dateOfBirth     DateTime
  region          String
  constituency    String
  pollingStation  String
  ghanaCard       String?
  voterIdNumber   String?
  phone           String   @unique
  registrationMethod String @default("USSD")
  isActive        Boolean  @default(true)
  totalDuesPaid   Float    @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  duesPayments    DuesPayment[]
  smsReceipts     SmsReceipt[]
}

model SmsMessage {
  id          String       @id @default(cuid())
  content     String
  sentBy      String
  sentAt      DateTime     @default(now())
  recipientCount Int
  deliveredCount Int       @default(0)
  totalCost   Float
  partyRevenue Float
  platformFee Float
  scheduling  String?      // "immediate" | "scheduled" | "recurring"
  scheduledFor DateTime?
  receipts    SmsReceipt[]
}

model SmsReceipt {
  id          String   @id @default(cuid())
  messageId   String
  message     SmsMessage @relation(fields: [messageId], references: [id])
  memberId    String
  member      Member   @relation(fields: [memberId], references: [id])
  delivered   Boolean  @default(false)
  deducted    Boolean  @default(false)
  amount      Float?
  deliveredAt DateTime?
}

model DuesPayment {
  id          String   @id @default(cuid())
  memberId    String
  member      Member   @relation(fields: [memberId], references: [id])
  amount      Float
  partyShare  Float    // GHC 1.00
  platformShare Float  // GHC 0.50
  triggeredBy String?  // SMS message ID that triggered deduction
  paidAt      DateTime @default(now())
}

enum Role {
  SUPER_ADMIN
  ADMIN
  CSAU_OFFICER
  SMD_EXAMINER
  SMD_REGIONAL
  LICENSED_SURVEYOR
  CLIENT
  MEMBERSHIP_ADMIN
}

enum Priority {
  STANDARD
  HIGH
  URGENT
}

enum JobStatus {
  IN_PROGRESS
  COMPLETED
  QUERIED
  CANCELLED
}

enum StepStatus {
  PENDING
  ACTIVE
  COMPLETED
  QUERIED
  SKIPPED
}
```

### API Routes (Next.js API)
```
src/app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   └── me/route.ts
├── jobs/
│   ├── route.ts (GET list, POST create)
│   ├── [id]/route.ts (GET, PUT, DELETE)
│   ├── [id]/workflow/route.ts (GET steps, PUT advance)
│   └── [id]/timeline/route.ts (GET, POST)
├── users/
│   ├── route.ts (GET list, POST create)
│   └── [id]/route.ts (GET, PUT, DELETE)
├── members/
│   ├── route.ts (GET list, POST create)
│   ├── [id]/route.ts (GET, PUT)
│   ├── import/route.ts (POST CSV/Excel import)
│   └── export/route.ts (GET CSV export)
├── sms/
│   ├── send/route.ts (POST)
│   ├── history/route.ts (GET)
│   └── webhook/route.ts (POST from provider)
├── ussd/
│   └── route.ts (POST USSD callback)
├── dues/
│   ├── route.ts (GET summary)
│   └── webhook/route.ts (POST payment confirmation)
└── reports/
    ├── jobs/route.ts (GET job statistics)
    └── membership/route.ts (GET membership statistics)
```

---

## 12. Phase 9 — Testing, Polish & Deployment

### Tasks

#### 9.1. UI Polish
- Responsive design testing (mobile, tablet, desktop)
- Dark mode support across all new pages
- Loading states (Skeleton components from LUNO)
- Error states and empty states
- Toast notifications (Sonner) for all actions
- Form validation UX (inline errors, success messages)

#### 9.2. Testing
- Unit tests for workflow engine logic
- Integration tests for API routes
- E2E tests for critical flows (login → create job → advance steps → client view)
- Accessibility audit (keyboard navigation, screen readers)

#### 9.3. Deployment
- **Frontend:** Vercel (already has `.vercelignore`)
- **Database:** Railway / Supabase / Neon (managed PostgreSQL)
- **SMS Provider:** Hubtel/Arkesel production account
- **Domain:** Custom domain for Land Commission portal
- Environment variables setup

---

## 13. File Structure (Target)

```
luno-admin-main/
├── prisma/
│   └── schema.prisma
├── public/
│   └── images/ (logos, icons)
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx (root layout)
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (home dashboard)
│   │   │   ├── admin/
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── workflow/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── client/
│   │   │   │   ├── search/page.tsx
│   │   │   │   ├── jobs/[id]/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   ├── membership/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── members/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── sms/page.tsx
│   │   │   │   ├── dues/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   └── reports/page.tsx
│   │   └── api/
│   │       ├── auth/...
│   │       ├── jobs/...
│   │       ├── users/...
│   │       ├── members/...
│   │       ├── sms/...
│   │       ├── ussd/...
│   │       ├── dues/...
│   │       └── reports/...
│   ├── components/
│   │   ├── sections/ (existing LUNO sections, modified)
│   │   ├── ui/ (existing 50+ LUNO components)
│   │   ├── jobs/ (new job-specific components)
│   │   ├── client/ (new client portal components)
│   │   ├── membership/ (new membership components)
│   │   └── workflow/ (new workflow engine components)
│   ├── contexts/
│   │   └── auth-context.tsx
│   ├── hooks/
│   │   ├── use-mobile.ts (existing)
│   │   ├── use-jobs.ts
│   │   ├── use-members.ts
│   │   └── use-workflow.ts
│   ├── lib/
│   │   ├── utils.ts (existing)
│   │   ├── auth.ts
│   │   ├── db.ts (Prisma client)
│   │   ├── workflow-engine.ts
│   │   ├── sms/
│   │   │   ├── provider.ts
│   │   │   ├── hubtel.ts
│   │   │   └── arkesel.ts
│   │   ├── ussd/
│   │   │   └── handler.ts
│   │   └── validations/
│   │       ├── auth.ts
│   │       ├── job.ts
│   │       └── member.ts
│   └── types/
│       ├── user.ts
│       ├── job.ts
│       ├── workflow.ts
│       └── member.ts
```

---

## 14. Implementation Priority & Timeline

### Recommended Build Order

| Phase | Description | Est. Effort | Priority |
|-------|-------------|-------------|----------|
| **Phase 1** | Foundation & Layout (routing, sidebar, branding) | 2–3 days | 🔴 Critical |
| **Phase 2** | Authentication (login, register, roles) | 2–3 days | 🔴 Critical |
| **Phase 3** | Admin Dashboard (job CRUD, job table, forms) | 4–5 days | 🔴 Critical |
| **Phase 4** | Client Portal (search, tracking, progress view) | 3–4 days | 🔴 Critical |
| **Phase 5** | 12-Step Workflow Engine (state machine, branching) | 3–4 days | 🟡 High |
| **Phase 6** | Membership System (members DB, SMS, dues) | 4–5 days | 🟡 High |
| **Phase 7** | SMS/USSD Integration (provider APIs) | 3–5 days | 🟠 Medium |
| **Phase 8** | Backend & Database (Prisma, API routes) | 4–6 days | 🟡 High |
| **Phase 9** | Testing, Polish & Deployment | 3–4 days | 🟠 Medium |

**Total Estimated Effort: 28–39 working days (6–8 weeks)**

### Suggested Sprint Plan

**Sprint 1 (Week 1–2): Core Foundation**
- Phase 1: Foundation + Layout
- Phase 2: Authentication
- Phase 8 (partial): Database schema + Prisma setup

**Sprint 2 (Week 3–4): Job Management**
- Phase 3: Admin Dashboard
- Phase 5: Workflow Engine
- Phase 8 (partial): Jobs API routes

**Sprint 3 (Week 5–6): Client & Membership**
- Phase 4: Client Portal
- Phase 6: Membership System
- Phase 8 (partial): Members/SMS API routes

**Sprint 4 (Week 7–8): Integration & Launch**
- Phase 7: SMS/USSD Integration
- Phase 9: Testing, Polish & Deployment

---

## 15. Risk & Considerations

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| SMS/USSD provider setup requires carrier approval | May delay Phase 7 by weeks | Start provider registration in Sprint 1 while building UI |
| Premium SMS (airtime deduction) requires NCA license in Ghana | Legal/compliance blocker | Engage legal counsel early; consider alternative payment methods (Mobile Money) |
| Excel import may have messy data | Data quality issues | Build data validation/cleaning pipeline in import feature |
| Multiple user roles complicate access control | Security vulnerabilities | Implement strict middleware-based route protection + server-side checks |

### Business Considerations
| Item | Note |
|------|------|
| **USSD Code Acquisition** | Must be registered with Ghana's NCA and a telecom operator (MTN, Vodafone, AirtelTigo). Costs ~GHC 2,000–5,000/year depending on the code type. |
| **Premium SMS Agreement** | Revenue-split model (GHC 1.00/0.50) requires a formal agreement with a Content Service Provider (CSP) licensed under NCA. |
| **Data Privacy** | Ghana's Data Protection Act (Act 843) applies. Member data (Ghana Card, Voter ID) is sensitive. Need privacy policy, consent mechanisms, and secure storage. |
| **Payment Reconciliation** | Track every deduction, provide statements. Financial compliance for party funds. |
| **Scalability** | If membership is large (100K+ members), SMS broadcasts need queue/batch processing. Use a message queue (BullMQ or similar). |

### What NOT to Build First
- ❌ Mobile app (focus on responsive web first)
- ❌ Real-time chat between admin and client (add later)
- ❌ AI-based recommendations (add later)
- ❌ Complex reporting dashboards (add after core workflows are stable)

---

## Quick Start: First 5 Files to Create

If you say **"go"**, I will start with these files immediately:

1. **`src/app/(auth)/layout.tsx`** — Auth layout (centered, no sidebar)
2. **`src/app/(auth)/login/page.tsx`** — Login page using LUNO components
3. **`src/app/(dashboard)/layout.tsx`** — Dashboard layout (sidebar + header)
4. **`src/app/(dashboard)/page.tsx`** — Dashboard home with stats
5. **Updated `src/components/sections/sidebar.tsx`** — New navigation menu

---

*This plan is a living document. Each phase can be adjusted based on priority changes, client feedback, or technical discoveries during implementation.*
