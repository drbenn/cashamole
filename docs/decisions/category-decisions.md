# Architecture Decision Record: Category Lifecycle & Integrity

## Status

**Accepted** | December 2025

## Context

In a financial tracking system, categories are the primary "connective tissue" for data. Deleting a category that has existing transactions or assets creates "orphaned" records, leading to inaccurate dashboard reporting and broken SQL joins.

## Decision

We will implement a Soft-Deactivate & Migrate pattern instead of hard deletion, combined with a Smart-Reactivation logic for category creation.

### 1. The "Safety Net" (Uncategorized)

**Requirement:** Every usage_type (Transaction, Asset, Liability) must have a system-protected "Uncategorized" category.

**Logic:** This category cannot be deactivated or renamed. It serves as the "Ground Truth" for any data that loses its specific classification.

### 2. Deactivation & Migration

**Process:** When a user deactivates a category:

- All related records (Transactions/Assets/Liabilities) are updated to point to the user_id's "Uncategorized" ID for that specific usage_type.
- The category is marked `active = false`.

**Reasoning:** This preserves the "SQL Monster" (Dashboard) calculations. If we deleted the category or the link, the financial totals would fluctuate or fail to load.

### 3. Smart Reactivation (Creation Flow)

**Process:** When a user creates a new category:

- The system checks the database for an existing category with the same name (case-insensitive) for that user and type.
- If an inactive version exists, the system reactivates it instead of creating a duplicate.

**Reasoning:**

- **Data Integrity:** Prevents "Category Bloat" (e.g., having 5 different 'Groceries' IDs in the DB history).
- **User Experience:** If a user previously set a specific icon or color for "Groceries," they get that preference back immediately upon "re-creating" it.

## Consequences

### Pros

- Total financial continuity (no missing dollars in the dashboard).
- Cleaner database (no duplicates).
- Faster queries (filtering by `active = true` keeps UI lists lean).

### Cons

- Deactivation is "destructive" to the specific classification (once moved to Uncategorized, the original specific tag is gone).
- **Mitigation:** UI should show a warning alert before finalizing deactivation.

## Technical Implementation Notes

- **Backend:** Handled via PostgreSQL Transactions (BEGIN/COMMIT) to ensure migration and deactivation happen atomically.
- **SQL Logic:** Uses `RETURNING *` on reactivation so the frontend store can update instantly without a secondary fetch.
