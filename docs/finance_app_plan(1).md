# Personal Finance App - System Design & Feature Roadmap

## 1. High-Level Architecture Overview

### 1.1 Three Deployment Models (All Same App)

**Desktop App (Tauri + Vue)**
- Local SQLite database
- Zero cloud dependency by default
- Works completely offline
- Optional: User can authenticate and sync to cloud

**Web App (Nuxt 4 + Vue 3)**
- Cloud-hosted on backend
- All data stored in PostgreSQL
- Requires internet connection
- Same features as desktop (eventually)

**Backend API (NestJS)**
- Handles authentication for both desktop and web
- Manages database for web users
- Handles sync operations for desktop users
- Enforces data validation and business rules

### 1.2 The Core Philosophy

Desktop users get full functionality with zero cloud involvement. Authentication and sync are *opt-in*, not required. Web users enjoy cloud convenience. Desktop and web users can eventually be the same person accessing their data both ways.

---

## 2. Authentication Architecture

### 2.1 Authentication Providers (Same System for Both Desktop & Web)

**Email/Password** (custom user database)
- Simple email + password registration/login
- Refresh token for session continuity
- Backend manages password hashing and validation

**OAuth (Optional Third Parties)**
- Google OAuth
- GitHub OAuth
- Auth0 as optional provider wrapper (can aggregate others)

**Why Same System?**
- Desktop user logs in with Google → receives JWT token
- Desktop stores token securely (OS credential manager)
- Web user logs in with same Google → same backend handles it
- If same person uses both, they're the same user account

### 2.2 Authentication State for Desktop

**Unauthenticated State:**
- Desktop app fully functional
- All data lives in local SQLite
- No backend communication
- No sync capability
- User sees "Optional: Sign in to backup your data" prompt (not nagging)

**Authenticated State:**
- User has logged in (email or OAuth)
- JWT token stored securely in OS credential manager (not in code, not in file)
- Desktop app can now sync with backend
- User can optionally enable automatic sync or manual sync

**Token Refresh:**
- Refresh tokens kept separate from access tokens
- Desktop handles token expiration gracefully
- If token expires and can't refresh, fall back to offline mode

### 2.3 Authentication Flow for Desktop

**User initiates login from Desktop:**
1. User clicks "Sign In" button in Desktop Settings
2. Desktop app opens system default browser to authentication page
3. Backend serves login UI (email/password form or OAuth buttons)
4. User authenticates (either method)
5. Backend generates JWT + Refresh Token
6. Backend redirects to special URL: `tauri://auth/callback?token=XXX&refresh=YYY`
7. Tauri deep link handler intercepts this URL
8. Desktop app securely stores tokens
9. Browser closes (or user closes it)
10. Desktop app shows "Successfully authenticated"

**Why this approach?**
- Uses system browser (user sees familiar auth UI)
- Secure token handling (never sent through desktop app internals)
- Deep link provides callback mechanism (doesn't require desktop server)
- User trust (they're logging in at a real HTTPS website, not sketchy desktop popup)

### 2.4 Authentication Flow for Web

**Standard web app flow:**
1. User visits web app domain
2. Clicks "Sign Up" or "Sign In"
3. Sees form (email/password) or OAuth buttons (Google, GitHub)
4. Authenticates
5. Redirected to dashboard
6. Session/JWT stored in browser (HttpOnly cookie or local storage)

### 2.5 Account Linking (Future Nice-to-Have)

Desktop user logs in with Google. Later, wants to also log in with GitHub email. Backend recognizes it's the same user → links accounts. Same user, multiple auth methods.

---

## 3. Data Model & Schema

### 3.1 Core Tables (Both Desktop SQLite & Web PostgreSQL)

**Accounts**
- id, name, type (checking/savings/credit_card/investment/loan/other)
- currency, starting_balance, current_balance
- is_active, notes, created_at, updated_at
- user_id (FK to User, only on web; implicit on desktop)

**Transactions**
- id, account_id, date, payee, category_id, description
- amount (signed: positive = deposit/income, negative = expense)
- type (income/expense/transfer/adjustment)
- status (pending/cleared/reconciled)
- tags, notes, receipt_path, created_at, updated_at
- user_id (FK to User, only on web; implicit on desktop)

**Categories** (hierarchical)
- id, name, parent_id (nullable, for nesting)
- type (income or expense)
- color, emoji, is_active, display_order, created_at, updated_at
- user_id (FK to User, only on web; implicit on desktop)

**Balance Snapshots** (for net worth tracking over time)
- id, snapshot_date, account_id, balance_amount, created_at
- user_id (FK to User, only on web; implicit on desktop)

**Budgets**
- id, name, category_id, period (monthly/yearly/custom)
- amount, start_date, end_date, notes, created_at, updated_at
- user_id (FK to User, only on web; implicit on desktop)

**Tags**
- id, name, color, usage_count, created_at, updated_at
- user_id (FK to User, only on web; implicit on desktop)

**Sync Log** (web only, tracks desktop syncs)
- id, user_id, device_id, sync_type (full/incremental)
- transactions_synced, conflicts_detected, last_sync_timestamp
- sync_direction (desktop_to_web or web_to_desktop)

---

## 4. Sync Strategy & Conflict Resolution

### 4.1 What Gets Synced?

**From Desktop to Web (when authenticated user initiates sync):**
- All transactions (new, updated, deleted)
- All accounts
- All categories
- All budgets
- Balance snapshots

**From Web to Desktop (when user initiates):**
- Any data created/edited in web app that the user wants to pull back to desktop
- Only if user explicitly requests desktop download

**One-way by default?** Decide: Does desktop always push to web, or can web push back? For MVP, probably one-way (desktop → web) with option for web → desktop later.

### 4.2 Conflict Detection & Resolution

**Scenario 1: Same transaction edited on desktop and web**
- Each transaction has unique ID + last_modified_timestamp
- Conflict detected if same transaction modified in both places
- Resolution strategy: **Last-write-wins** (industry standard)
  - Timestamp on both sides determines which version is kept
  - Simpler, predictable behavior
  - User can always verify what synced in sync report

**Scenario 2: Same transaction deleted on desktop, edited on web**
- Deletion takes precedence (user explicitly deleted it locally)
- Or: Flag as conflict and ask user

**Scenario 3: New transaction on desktop, same transaction on web (duplicate)**
- Match by date + amount + payee + category (fuzzy matching)
- If high confidence match, warn user before syncing
- If no match, sync as separate transaction

**Sync Conflict Reporting**:
- After every sync, show user summary: "X transactions synced, Y conflicts detected"
- Display conflicts with both versions so user can verify
- Sync log available in settings (history of all syncs)

### 4.3 Sync Frequency & Control

**Desktop:**
- Manual sync only (user clicks "Sync Now" button)
- Shows progress, conflicts, summary after
- Can be scheduled (e.g., every night at 2 AM) but off by default

**Web:**
- Auto-sync on every action (standard cloud app behavior)

**Incremental vs Full Sync:**
- Desktop supports both: full sync (re-uploads everything) or incremental (only what's changed)
- Incremental requires tracking modified_at timestamps accurately
- Full sync simpler, less prone to sync bugs

---

## 5. User Workflows & Pages

### 5.1 Desktop App (Tauri) Core Workflows

**Workflow 1: Dashboard/Home**
- Visual snapshot: net worth, month-to-date income/expense, account balances
- Quick action buttons (New Transaction, New Account, View Reports)
- Recent transactions list
- Budget progress bars for current month
- All local, immediate (no waiting for anything)

**Workflow 2: Add Transaction**
- Modal or sidebar form
- Fields: Account, Date, Payee, Category, Amount, Description, Tags
- Autocomplete on payee (from history)
- Quick categorization (recent categories at top)
- Save & add another option
- Local save is instant

**Workflow 3: Account Management**
- List all accounts with current balances
- Edit account details
- Reconcile account (mark transactions as cleared)
- View account details + transaction history

**Workflow 4: Reconciliation**
- Select account and date range
- Show all transactions, mark as cleared/uncleared
- Calculate: manual balance vs actual balance
- Flag discrepancies
- Save reconciliation state

**Workflow 5: Reports & Analysis**
- Net worth trend (line chart, data from balance snapshots)
- Income vs Expense (bar chart, by month)
- Category breakdown (pie chart, current month)
- Savings rate (calculated metric)
- Filter by date range, account, category
- Export to CSV

**Workflow 6: Budget Planning**
- View all budgets, see budget vs actual for current month
- Add new budget (category + amount + period)
- Visual indicators (on track, warning, over)

**Workflow 7: Settings & Authentication**
- App preferences (theme, date format, currency)
- **Auth section**: "Sign In to Sync"
  - If not authenticated: Shows login options, explains what sync does
  - If authenticated: Shows email, last sync timestamp, manual sync button, logout
  - Optional: Toggle automatic sync (off by default)
- Data export (JSON, CSV)
- Data import (JSON file)
- About & support

### 5.2 Web App (Nuxt 4) Workflows

**Landing Page (Unauthenticated)**
- Marketing copy: why use this app
- Sign Up / Sign In buttons

**Onboarding Flow (First Time User)**
- Step 1: Create initial accounts
- Step 2: Import transactions (or start fresh)
- Step 3: Set up categories
- Step 4: Done, redirect to dashboard

**Dashboard**
- Same as desktop (net worth, income/expense, budgets, etc.)
- Mobile responsive
- Real-time (updates as you add transactions)

**All Core Workflows**
- Add transaction, manage accounts, reconcile, reports, budgets
- Same as desktop, but cloud-backed
- Auto-save behavior (no "save" button, just updates in real-time)

**User Account**
- Profile: name, email, password reset
- Security: change password, logout
- Optional: Link additional OAuth providers
- Optional: Download all my data (GDPR-style export)

---

## 6. Feature Roadmap & Phasing

### Phase 1: MVP (Desktop Only, Local-First)
**Goal: Get core personal finance tracking working, no cloud**

Core features:
- Account management (create, edit, delete, view)
- Transaction entry (manual entry, no auto-import)
- Category management (hierarchical support)
- Dashboard overview (net worth, income/expense, balances)
- Basic reports (trends, category breakdown)
- Account reconciliation
- Tags for transactions
- Search & filter transactions
- **Import existing data from Excel** (transactions & balance snapshots)
- Settings & preferences
- Database encryption (SQLCipher)

**No auth, no sync needed yet. All local SQLite (encrypted).**

**Why start here?**
- Desktop users get immediate value
- Core workflows validated
- Schema solidified
- Ready for sync layer to be added later
- Users can bootstrap with historical data from Excel tracker

---

### Phase 2: Enhanced Desktop Experience
**Goal: Power-user features, improve workflows, still local**

Features:
- Recurring transactions (templates/rules)
- Split transactions (one transaction, multiple categories)
- Transaction attachments (store receipt images locally)
- Advanced filtering & saved views
- Bulk edit transactions
- Net worth chart widget (historical tracking via balance snapshots)
- Auto-categorization rules (if payee = "Amazon", auto-categorize as "Shopping")
- Debt payoff calculator (for loan accounts)
- Savings goals tracking (set target, track progress)
- Multi-currency support (with manual exchange rates or API lookup)
- **Export all data** (JSON, CSV format)
- Backup/restore functionality

**All still local, no sync.**

---

### Phase 3: Authentication & Sync Infrastructure
**Goal: Add auth system and one-way sync, still desktop-first**

Features:
- Email/password authentication (backend infrastructure)
- OAuth support (Google, GitHub)
- Desktop authentication flow (browser + deep link)
- Token secure storage in desktop
- Sync to cloud (one-way, desktop → web backend)
- Sync conflict detection & reporting
- Manual sync trigger (user clicks "Sync Now")
- Sync history/log
- Optional: Automatic sync scheduling (e.g., nightly)

**Backend now exists, PostgreSQL ready, but no web UI yet.**

---

### Phase 4: Web App MVP
**Goal: First web app release, feature parity with desktop Phase 1-2**

Features:
- Nuxt 4 web app scaffolding
- User registration & login (email/OAuth)
- Onboarding flow
- All Phase 1 features (accounts, transactions, categories, dashboard, reports, reconciliation)
- All Phase 2 features (recurring, splits, auto-categorization, goals, etc.)
- Mobile responsive design
- Real-time sync on every action
- User account management
- Data export (GDPR-style download)
- Offline-first architecture (IndexedDB fallback for PWA mode)

**Web users now have full feature set. Desktop and web users can be the same person.**

---

### Phase 5: Bidirectional Sync & Advanced Features
**Goal: Users can work on both desktop and web seamlessly**

Features:
- Bidirectional sync (web ↔ desktop)
- Conflict resolution UI
- Multiple devices per user
- Device management (see which devices have synced)
- Investment account tracking (manual entry, net worth integration)
- Loan amortization calculator & scheduler
- Early payment tracking (extra principal payments)
- Tax reporting (category-based tax summary, export for accountant)
- Advanced budgeting (zero-based, envelope method)
- Bill reminders & notifications
- Forecasting (project net worth based on historical trends)

---

### Phase 6+: Collaboration & Mobile
**Goal: Expand to families, households, and mobile**

Features:
- Shared accounts (household/family budgeting)
- Permissions (view-only, edit, admin)
- Activity log (who changed what, when)
- Mobile app (React Native or Flutter)
- Notifications (budget alerts, sync status)
- API access for power users
- Integrations (webhook support, etc.)

---

## 7. Data Flow: Desktop ↔ Backend

### 7.1 Desktop Sync Architecture

**Desktop State:**
- Local SQLite database (all user transactions, accounts, etc.), encrypted at rest (SQLCipher)
- Auth tokens stored in OS credential manager
- Modified_at timestamps on all records
- Sync state (last successful sync timestamp, pending changes)

**When User Clicks "Sync":**
1. Desktop reads all transactions from SQLite modified after last sync
2. Desktop also checks for web-side changes (timestamp-based)
3. Desktop prepares JSON payload with changes from both sides
4. Desktop includes user auth token in request (HTTPS)
5. Backend receives payload, validates token, processes changes
6. Backend applies bidirectional merge:
   - New transactions on desktop → added to web
   - New transactions on web → returned to desktop
   - Same transaction modified on both sides → last-write-wins based on timestamp
7. Backend returns response: "X transactions synced, Y conflicts detected, Z from web"
8. Desktop updates local sync state
9. Desktop shows user summary: "5 uploaded, 3 downloaded, 0 conflicts"

**Sync Report**:
- Shows timestamp of sync
- Lists what was uploaded, downloaded, any conflicts
- User can verify and undo if needed
- History of all syncs available in settings

---

### 7.2 Web User Data Storage

**Web users have zero local database.**
- All data always on PostgreSQL backend
- Browser session/JWT handles authentication
- Each action (add transaction, etc.) sends request to backend
- Backend validates, stores, returns
- Frontend updates UI optimistically (shows change immediately, confirms after)

---

## 8. Design Decision: One Codebase or Multiple?

### Option A: Monorepo (Recommended)
```
finance-app-monorepo/
├── packages/
│   ├── desktop/          (Tauri + Vue)
│   ├── web/              (Nuxt 4)
│   ├── backend/          (NestJS)
│   ├── shared-types/     (TypeScript types shared by all)
│   └── ui-components/    (Vue components library, shared by desktop & web)
├── .github/
│   ├── workflows/        (GitHub Actions CI/CD)
│   └── projects/         (Roadmap board)
├── docs/
│   └── README, architecture guides, etc.
└── package.json          (monorepo root)
```

**Benefits:**
- Shared TypeScript types between frontend & backend
- Shared Vue component library (Desktop & Web use same components)
- Single place to manage versions
- Single CI/CD pipeline

---

## 9. GitHub Organization for Solo Dev (Free Tier)

### 9.1 GitHub Projects (Roadmap)
- Create one project: "Finance App Roadmap"
- Columns: Backlog | Phase 1 | Phase 2 | Phase 3 | In Progress | Done
- Link issues to project cards
- Visual Kanban board for tracking progress

### 9.2 GitHub Wiki (Architecture & Decisions)
Create wiki pages for:
- **Architecture Overview**: High-level system design, diagrams
- **Authentication**: Auth flows, token management, OAuth setup
- **Sync Strategy**: Conflict resolution rules, data flow diagrams
- **Database Schema**: Tables, relationships, key decisions
- **API Design**: NestJS endpoints (what they do, request/response)
- **Data Models**: Desktop SQLite vs Web PostgreSQL differences
- **Feature Specifications**: Detailed workflows for each feature
- **Development Guide**: How to set up local environment, run tests
- **Decisions Log**: Why certain tech choices were made

### 9.3 GitHub Issues
- Create issues for each feature (Phase 1, Phase 2, etc.)
- Assign to yourself
- Use labels: `frontend`, `backend`, `bug`, `enhancement`, `phase-1`, `phase-2`
- Issues get linked to project cards
- Use milestone feature to group by phase

### 9.4 GitHub Actions (CI/CD)
- Lint & test on every commit
- Build desktop app (Tauri) for Linux/macOS/Windows
- Build web app (Nuxt)
- Deploy web to hosting (Vercel, Railway, etc.)

---

## 10. Technology Stack Summary

### Desktop
- **Tauri**: Desktop app framework (Rust backend, Vue frontend)
- **Vue 3 + TypeScript**: Frontend framework
- **Pinia**: State management
- **SQLite**: Local database
- **Tailwind CSS** (or similar): Styling

### Web
- **Nuxt 4**: Full-stack Vue framework
- **TypeScript**: Type safety
- **PostgreSQL**: Database
- **NuxtAuth.js**: Authentication

### Backend
- **NestJS**: REST API framework (Node.js + TypeScript)
- **PostgreSQL**: Persistent storage
- **Passport**: Authentication strategies (local, Google, GitHub)

### Shared
- **TypeScript**: Unified language across full stack
- **Monorepo**: Single repo, shared types & components
- **GitHub**: Code hosting, CI/CD, project management

---

## 11. Key Architectural Decisions (Finalized)

### Decision 1: Sync Direction ✓ DECIDED
**Bidirectional sync with timestamp-based conflict resolution**
- Desktop ↔ Web (both directions)
- Check `last_modified` timestamps on both sides since last sync
- Merge changes from both directions
- Last-write-wins if same record modified on both sides
- Sync report shows user exactly what changed

### Decision 2: Conflict Resolution Strategy ✓ DECIDED
**Last-modified-timestamp wins (industry standard)**
- Deterministic, predictable behavior
- Works with bidirectional sync
- Detailed sync report lets user verify
- Simple to implement and debug

### Decision 3: Data Security ✓ DECIDED
**Desktop**: SQLCipher encryption (encrypted SQLite database at rest)
**In Transit**: HTTPS for all API calls
**Web**: Standard database security (access controls, HTTPS, password hashing)
- No application-level encryption for Phase 1
- Can be added in Phase 2 if needed

### Decision 4: Data Import/Export ✓ DECIDED
**Import**: MVP feature (Phase 1) - Excel file import for historical transactions & balance snapshots
**Export**: Phase 2 feature - Export all data as JSON or CSV
- Allows users to bootstrap from existing Excel tracker
- Supports data portability and backup

### Decision 5: One Codebase ✓ DECIDED
**Monorepo architecture**
- Desktop (Tauri + Vue)
- Web (Nuxt 4)
- Backend (NestJS)
- Shared types and components
- Single CI/CD pipeline

### Decision 6: Web Hosting ✓ DECIDED
**Railway or Fly.io for MVP**
- Free tier sufficient
- Easy deployment
- Low operational burden for solo dev
- Can migrate later if needed

---

## 12. Your 11-Year Excel Tracker

**Action Item**: Document 3-5 must-have workflows from your Excel tracker that the app must preserve:
- What do you calculate that other apps might miss?
- How do you organize accounts or categories?
- Any unique reconciliation approach?
- Specific views or reports you rely on?
- Balance sheet logic that's custom?

**This ensures new app isn't built blind.**

---

## 13. Next Steps (Planning Phase)

1. **Validate this architecture**: Does it match your vision?
2. **Create GitHub repo**: Set up monorepo structure (no code yet)
3. **Create GitHub Wiki**: Start documenting architecture decisions
4. **Create GitHub Project**: Set up Kanban board with phases
5. **Sketch sync flows**: Detailed diagrams (Excalidraw or Mermaid)
6. **Document your Excel tracker**: What must be preserved?
7. **Finalize data model**: Review schema with your use cases
8. **Define API endpoints**: List all NestJS endpoints (what they do, in plain English)
9. **Create component inventory**: List all Vue components you'll need (no design, just inventory)
10. **Start Phase 1 breakdown**: What are the discrete tasks within Phase 1?

---

## 14. Timeline Estimate (Solo Developer, Part-Time Assumption)

**Phase 1 (MVP - Desktop Local)**: 6-8 weeks
**Phase 2 (Enhanced Desktop)**: 6-8 weeks
**Phase 3 (Auth & Sync)**: 4-6 weeks
**Phase 4 (Web App MVP)**: 8-10 weeks
**Phase 5 (Bidirectional & Advanced)**: Ongoing, 2+ weeks per feature

**Total to full feature parity (Phase 4)**: ~5-6 months part-time