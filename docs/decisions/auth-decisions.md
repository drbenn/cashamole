# Authentication Architecture Decisions

## 1. Authentication Method

**Decision**: Email/Password only (no OAuth)

**Rationale**:

- Privacy-first philosophy: No reliance on third-party services (Google, GitHub)
- Full control of authentication flow
- Simpler implementation and maintenance
- User data stays with us

**Trade-off**: Users must remember password (can reset if forgotten)

---

## 2. Email Confirmation Flow

**Decision**: Email confirmation required before login

**Process**:

1. User registers with email + password
2. Confirmation code sent via email
3. User clicks link or enters code
4. Account enabled for login
5. User redirected to login page

**Unconfirmed User Attempt**: Shows "Email Not Confirmed" page with resend button

**Rationale**:

- Verifies email ownership
- Prevents spam registrations
- Industry standard for email-based auth

---

## 3. Password Reset Flow

**Decision**: Email-based reset with auto-login after password change

**Process**:

1. User clicks "Forgot Password"
2. Enters email
3. Receives reset link via email
4. Clicks link, sets new password
5. Auto-logged in, redirected to dashboard
6. Old refresh tokens invalidated

**Rationale**:

- Email is secure channel for identity verification
- Auto-login improves UX after reset
- Invalidating old tokens prevents session hijacking

---

## 4. Token Strategy

**Decision**: JWT with dual-token approach (Access + Refresh)

**Web (Nuxt)**:

- Access Token: 15 minutes (short-lived)
- Refresh Token: 7 days (long-lived, HttpOnly cookie)
- Auto-refresh: Frontend refreshes before expiry

**Desktop (Tauri)**:

- Access Token: 15 minutes (same as web)
- Refresh Token: 7 days (same as web)
- Storage: OS Credential Manager (secure)
- Auto-refresh: App refreshes before requests

**Rationale**:

- Short access token limits damage if leaked
- Long refresh token keeps user logged in
- Credential Manager on desktop = secure storage
- HttpOnly cookie on web = secure storage

---

## 5. Token Expiry & Refresh

**Decision**: Proactive refresh before expiry

**Web**: Frontend checks expiry, refreshes if needed before request

**Desktop**: App checks expiry, refreshes if needed before request

**On Failed Refresh**:

- Web: Redirect to login, show "Session expired"
- Desktop: Clear credentials, show "Re-authenticate"

**Rationale**:

- Prevents user-facing 401 errors
- Seamless UX
- Refresh tokens allow persistent login

---

## 6. Session Management

**Decision**: Stateless JWT tokens (no server-side session store needed)

**Rationale**:

- Scales easily
- No session database to manage
- Tokens are self-contained (include user ID, permissions)
- Standard for modern APIs

---

## 7. Logout Flow

**Decision**: Token invalidation on backend, deletion on client

**Web**:

- Clear HttpOnly cookie
- Clear local access token
- POST /auth/logout (optional, for audit trail)

**Desktop**:

- Clear tokens from OS Credential Manager
- Revert to offline-only mode
- Local SQLite data still accessible

**Rationale**:

- Prevents token reuse after logout
- Clean state for next login
- Desktop maintains local data access

---

## 8. Account Linking (Future)

**Decision**: Not in MVP, planned for Phase 2+

**Future scenario**: User registers with email, later wants to link another identity (future OAuth or passkey)

- One email = one account
- Can link multiple auth methods to same account
- Deduplication based on email

---

## 9. Error Handling

**Decision**: Clear, user-friendly error messages

**Registration**:

- "Email already registered"
- "Password too weak" (requirements: min 8 chars, uppercase, number, special char)
- "Invalid email format"

**Login**:

- "Invalid email or password" (don't reveal which is wrong)
- "Account not confirmed yet" (show resend button)

**Password Reset**:

- "Email not found" (generic to prevent account enumeration)
- "Reset link expired" (resend required)

**Token Refresh**:

- "Session expired, please login again"

---

## 10. Password Requirements

**Decision**: Strong password policy

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

**Rationale**:

- Prevents weak passwords
- Industry standard
- User education on security

---

## 11. Rate Limiting

**Decision**: Rate limit auth endpoints to prevent brute force

**Limits**:

- Login attempts: 5 per minute per IP
- Registration: 3 per minute per IP
- Password reset: 2 per 10 minutes per email
- Confirmation resend: 3 per 10 minutes per email

**Action**: Show "Too many attempts, try again in X minutes"

---

## 12. Data Security in Transit

**Decision**: HTTPS only, no application-level encryption for MVP

**Web ↔ Backend**: HTTPS (tokens in HttpOnly cookies)
**Desktop ↔ Backend**: HTTPS (tokens in credential manager)

**Rationale**:

- HTTPS sufficient for MVP
- Application-level encryption can be added in Phase 2 if needed
- Credential manager + HTTPS = solid security posture

---

## 13. Data Security at Rest

**Decision**: Database encryption on desktop, standard DB security on web

**Desktop**: SQLCipher (encrypted SQLite)

- User password → Key derivation → Database encryption
- Database unreadable without password
- Tokens stored in OS Credential Manager (separate from DB)

**Web**: PostgreSQL with standard security

- Access controls
- No plaintext passwords stored
- Can add field-level encryption in Phase 2

---

## 14. Audit Trail

**Decision**: Log auth events (MVP: basic, Phase 2: comprehensive)

**MVP**:

- Login attempts (success/failure)
- Registrations
- Password resets
- Logouts

**Phase 2+**:

- IP address tracking
- Device fingerprinting
- Suspicious activity alerts
- Session activity log
