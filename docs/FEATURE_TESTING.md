# PakPay — Feature Testing Report (Phase 3)

**Method:** Static code-path analysis (no live penetration test).  
**Date:** 2026-05-30  
**Scope:** `apps/user-app`, `apps/bank-webhook`, `apps/socket-gateway`, `packages/db`

Severity legend: **CRITICAL** | **HIGH** | **MEDIUM** | **LOW**

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 6 |
| MEDIUM | 9 |
| LOW | 7 |

---

## 1. Registration & authentication

### Registration (`POST /api/register`)

| Check | Result |
|-------|--------|
| Functional | ✅ Zod schema, duplicate email/phone checks, bcrypt hash, `Balance` + optional `MerchantProfile` |
| Edge cases | ✅ IP rate limit (5 / 10 min); ⚠️ no email verification |
| Auth | ✅ Public by design |
| IDOR | ✅ N/A |
| Errors | ✅ `handleApiError` for P2002 |
| Transactions | ⚠️ User + balance not single `$transaction` — partial create possible on crash |

**MEDIUM** — User creation and balance insert are not wrapped in one transaction.

### Sign in (NextAuth + `/api/auth/login`)

| Check | Result |
|-------|--------|
| Functional | ✅ bcrypt, lockout, JWT 8h + updateAge 1h |
| Session invalidation | ✅ `sessionVersion` on reset; ⚠️ no increment on explicit sign-out API |
| Cookies | ✅ httpOnly + secure; ⚠️ `sameSite: none` + `secure: true` breaks local HTTP dev without HTTPS |

**LOW** — No server-side “logout all devices” except password reset.

### Password reset

| Check | Result |
|-------|--------|
| Functional | ✅ Hashed token, expiry, `sessionVersion` increment |
| Enumeration | ✅ Generic forgot-password messaging (verify route) |

**LOW** — `mailer.ts` logs `EMAIL_PASS` via `console.log` in dev path.

---

## 2. Wallet — on-ramp

| Check | Result |
|-------|--------|
| Create | ✅ Rate limits; amount in paisa; status `Processing` |
| Proxy | ✅ Session + `userId` match; calls signed webhook |
| Webhook | ✅ Atomic credit + status; Redis publish |
| Double credit | ⚠️ No idempotency if `hdfcWebHook` called twice for same token while `Processing` |

**HIGH** — Repeat `onramp-proxy` / webhook on same token may double-credit if status still `Processing` (no terminal-state guard in webhook).

### Socket notification

| Check | Result |
|-------|--------|
| Scope | ✅ Emits to `user-{userId}` only |
| Payload | ✅ Limited fields (`userId`, `amount`, `token`, `type`) |

---

## 3. Wallet — off-ramp

| Check | Result |
|-------|--------|
| Create | ✅ Locks funds in same `$transaction` as txn row |
| Webhook success | ✅ `amount` and `locked` decremented; uses `offRamp.amount` |
| Webhook failure | ✅ Releases `locked` |
| Insufficient at webhook | ✅ Fails without debiting gross incorrectly |

**MEDIUM** — `offramp-proxy` does not rate-limit separately beyond create route; user could spam proxy if token exists.

**LOW** — Legacy off-ramps created before lock feature may have no `locked` reservation.

---

## 4. P2P transfer (server action)

| Check | Result |
|-------|--------|
| Functional | ✅ `FOR UPDATE`, spendable check, debit/credit + history row |
| Self-transfer | ⚠️ Not blocked if same user has two numbers (N/A) — can send to another account with same phone only one user |
| Negative amount | ✅ `pkrToPaisa` on positive UI input; schema not on server action |

**MEDIUM** — Server action lacks Zod validation on `amountPkr` (trusts client).

**LOW** — No rate limit on P2P action.

---

## 5. Merchant payment (`POST /api/pay`)

| Check | Result |
|-------|--------|
| Lock on PENDING | ✅ `lockFundsForMerchantPayment` |
| Finalize on SUCCESS | ✅ `finalizeCustomerMerchantPayment` after webhook |
| Compensation | ✅ Releases lock on failure |
| Idempotency | ✅ Duplicate `ref` + `SUCCESS` returns existing |
| Race | ✅ `FOR UPDATE` on balance |
| KYC | ✅ Merchant must exist; pay page checks VERIFIED |

**HIGH** — `pending_retry` path retries webhook but does not re-lock; OK if lock already held; **stale PENDING without lock** (pre-migration) could succeed webhook without finalize leaving inflated gross.

**MEDIUM** — Balance check at pay time vs webhook finalize are two steps — transient `SUCCESS` + failed finalize leaves lock until manual fix (finalize is idempotent if `locked >= amount`).

---

## 6. Public pay page

| Check | Result |
|-------|--------|
| `GET /api/pay/merchant` | ✅ Public; only non-sensitive fields; VERIFIED + QR check |
| `POST /api/pay` | ✅ Session required; customerId from session (no IDOR on pay) |

**LOW** — Merchant ID enumerable for verified merchants (expected for QR commerce).

---

## 7. Merchant KYC & profile

| Check | Result |
|-------|--------|
| Upload | ✅ MERCHANT session; Cloudinary |
| Admin KYC | ✅ ADMIN role on API |
| Page guard | ✅ Middleware `/merchant/*` |

**HIGH** — `admin/layout.tsx` is `"use client"` with **commented-out** `getServerSession` — relies solely on middleware + per-page checks. Individual admin **pages** must each enforce role (verify each page).

**MEDIUM** — Admin layout invalid pattern (`async` + `"use client"`) may cause Next.js warnings.

---

## 8. Settlements (cron)

| Check | Result |
|-------|--------|
| Ordering | ✅ Webhook before `settled=true` |
| Lock | ✅ `finally` releases `SettlementLock` |
| Zombies | ✅ PROCESSING > 10 min → FAILED |
| Skip in-flight | ✅ Recent PROCESSING merchant skipped |

**MEDIUM** — Cron not idempotent across partial failures for same txn batch if settlement row FAILED but some txns were marked in older code version.

**LOW** — Dev mode allows cron without secret if `CRON_SECRET` unset.

---

## 9. Disputes

| Check | Result |
|-------|--------|
| Duplicate | ✅ `@@unique([transactionId])` + P2002 → 409 |
| Authorization | ✅ POST scoped to `customerId` on txn |
| Refund | ✅ Atomic balance reversal + audit log |

**MEDIUM** — Admin refund does not check merchant spendable balance (merchant can go negative).

---

## 10. Admin APIs

| Endpoint | Role check | IDOR |
|----------|------------|------|
| `/api/admin/merchants` | ✅ ADMIN | N/A |
| `/api/admin/kyc` | ✅ ADMIN | ⚠️ any merchantId |
| `/api/admin/transactions` | ✅ ADMIN | N/A |
| `/api/admin/disputes` | ✅ ADMIN | N/A |

**LOW** — No audit log for all admin reads; only dispute actions logged.

---

## 11. Real-time (Socket.IO)

| Check | Result |
|-------|--------|
| User events | ✅ Room-scoped |
| Merchant events | ✅ Room-scoped |
| Auth on connect | ⚠️ Trusts `handshake.auth.userId` — no server-side token bind |

**HIGH** — Any client can join `user-{id}` or `merchant-{id}` by guessing IDs (no JWT verification on socket gateway).

---

## 12. Financial integrity matrix

| Flow | Atomic | Idempotent | Lock / race |
|------|--------|------------|-------------|
| On-ramp | ✅ | ⚠️ Partial | N/A |
| Off-ramp | ✅ | ⚠️ Partial | ✅ |
| P2P | ✅ | ❌ | ✅ |
| Merchant pay | ✅ | ✅ ref | ✅ |
| Settlement | ✅ | ⚠️ | ✅ cron lock |
| Admin refund | ✅ | ⚠️ | N/A |

---

## 13. Error handling & UI

| Area | Result |
|------|--------|
| API errors | ✅ `jsonError`, Zod messages |
| Logging | ⚠️ Mix of Winston and `console.error` |
| Session invalid | ⚠️ `session` callback **throws** — may surface as 500 on RSC pages |
| UI toasts | ✅ Socket + toast helpers |

**MEDIUM** — Inconsistent structured logging across routes.

---

## 14. Untested / manual QA recommended

- [ ] End-to-end Playwright against Docker stack
- [ ] Concurrent pay requests same user (k6)
- [ ] Webhook signature rejection / replay
- [ ] Cloudinary upload failure paths
- [ ] PDF statement generation edge dates
- [ ] Session expiry after 8h and after password reset
- [ ] Merchant negative balance after dispute refund

---

## Issue register (prioritized)

| ID | Severity | Finding |
|----|----------|---------|
| F-01 | **CRITICAL** | Socket gateway accepts arbitrary `userId` / `merchantId` in handshake — no JWT binding |
| F-02 | **CRITICAL** | Platform is a **simulated** fintech — not safe for real funds or regulated launch |
| F-03 | **HIGH** | On-ramp webhook may double-credit if called while still `Processing` |
| F-04 | **HIGH** | Socket / room auth bypass enables cross-user notification spoofing (low data leakage, UX phishing) |
| F-05 | **HIGH** | Admin UI layout lacks enforced server session (middleware only) |
| F-06 | **HIGH** | No automated integration tests for ledger invariants |
| F-07 | **HIGH** | Admin refund can drive merchant balance negative |
| F-08 | **HIGH** | Legacy data without locks may desync after deploy |
| F-09 | **MEDIUM** | Register user+balance not transactional |
| F-10 | **MEDIUM** | P2P server action missing server-side amount schema |
| F-11 | **MEDIUM** | Session callback throw on invalid session |
| F-12 | **MEDIUM** | On-ramp idempotency gap |
| F-13 | **LOW** | P2P / some routes lack rate limits |
| F-14 | **LOW** | INR not present; PKR used (Bug 5 already addressed) |
