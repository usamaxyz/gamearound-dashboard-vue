# Architectural Review: Gamearound Dashboard

This document provides a critical review of the proposed tech stack and architecture for the Gamearound Dashboard. Overall, the suggestions are **excellent** and follow modern AWS serverless best practices. However, there are a few "gotchas" regarding scalability and performance that we should address before building.

## 🟢 Strengths of the Current Plan
- **Vite + Vue 3 + Pinia**: A high-performance foundation. Vite's DX (Developer Experience) is superior to older build tools, and Pinia is much more intuitive than Vuex.
- **Cognito JWT Multi-tenancy**: Including `custom:organization_id` in the JWT is the "gold standard" for serverless multi-tenancy. It prevents "IDOR" (Insecure Direct Object Reference) because the Lambda doesn't trust the client for the Org ID; it trusts the signed token.
- **Decoupled Permissions**: Storing permissions in DynamoDB instead of Cognito Groups is a very smart move. Cognito Groups are best for high-level roles (Admin vs. User), while DynamoDB is better for granular permissions (e.g., `game:create`, `billing:view`).

---

## 🟡 Suggested Updates & Optimizations

### 1. Avoid Querying Cognito for User Lists (Major Recommendation)
**The Suggestion:** *"To List Users: The Lambda calls the Cognito ListUsers API using a Filter: Attributes.custom:organization_id = 'ADMIN_ORG_ID'."*

**The Problem:** Cognito's `ListUsers` API is **not a database**.
- It has very strict **Rate Limits** (RPS). If your dashboard gets busy, this will fail.
- Filtering by custom attributes is slow and not indexed like a real DB.
- You cannot perform complex sorts or joins (e.g., "List all users in Org A created in the last 30 days").

**The Better Way:**
- Use a **Post-Confirmation Lambda Trigger** in Cognito. 
- When a user successfully confirms their account, this Lambda automatically writes a record to a `Users` table in **DynamoDB**.
- Perform all "List Users," "Search Users," and "Filter Users" operations against your DynamoDB table. Use Cognito only for Authentication.

### 2. Organizational Metadata Table
While you have an `organization_id` in the token, you likely need a dedicated `Organizations` table in DynamoDB to store:
- Organization Name
- Subscription Tier (Pro, Free, Enterprise)
- Created At
- Global Settings for that Org

### 3. Permissions Caching
Instead of querying DynamoDB on every single API call to check permissions:
- You can include a condensed version of permissions in the JWT if they are small.
- **Or**, more reliably, the Lambda can cache the permissions in memory for the duration of the Lambda execution context (warm start).

---

## 🔴 Potential Future Issues

### 1. The "Switching Organizations" Problem
If a developer (user) ever needs to belong to **multiple** organizations (e.g., a Consultant working for both Company A and Company B), the `custom:organization_id` approach becomes difficult because a JWT usually only holds one value.
- **Solution:** If you anticipate this, store a list of `Membership` records in DynamoDB and have a "Switch Organization" feature in the UI that refreshes the token with a different context.

### 2. Cognito Rate Limits
As you scale to thousands of users, avoid calling Cognito APIs from your application logic (except for Auth). Use Cognito as an Identity Provider, and DynamoDB as your Application State.

### 3. CSS & Design Consistency
For a "Premium" dashboard, generic CSS frameworks can look "cheap." I recommend a custom Design System built on **Vanilla CSS Variables** or a refined toolkit like **Ant Design Vue** or **PrimeVue** if you want pre-built components, but with a highly customized theme.

---

## 🎨 Design Vision (Premium Aesthetic)
To make this "Wow" the user:
- **Dark Mode by Default**: Deep grays (`#0f172a`) and vibrant accents (Electric Blue or Cyber Purple).
- **Glassmorphism**: Use `backdrop-filter: blur()` for sidebars and overlays.
- **Micro-interactions**: Subtle hover scales and smooth transitions between dashboard views.

---

## Next Steps
1. **Decision**: Do you want to proceed with the "DynamoDB Sync" approach for users, or stay purely with Cognito for simplicity in the MVP?
2. **Setup**: Once we agree on the refinements, I can begin building the `src/` structure and the core layout.
