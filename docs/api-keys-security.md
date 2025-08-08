## User API Keys: Storage, Encryption, and Hardening Plan

### How it works today
- **Submission**: Keys are entered in Settings and sent over HTTPS to the server; never stored in local storage.
- **Validation**: Server trims/cleans and validates per provider format before save.
- **Encryption at rest**: `AES-256-CBC` with a fresh 16‑byte IV per key. The 32‑byte cipher key is derived with `scrypt` from the env secret `API_KEY_ENCRYPTION_KEY`.
  - Code: `src/lib/encryption.ts` (`encryptApiKey`, `decryptApiKey`).
  - Stored format: `ivHex:cipherHex`.
- **Database fields**: on `User` — `encryptedOpenAIKey`, `encryptedAnthropicKey`, `encryptedGoogleKey` (`prisma/schema.prisma`).
- **AuthN/Z**: Routes use Supabase SSR cookies. Only the authenticated user can create/remove their own key.
- **Usage**: Decrypts only on the server, just-in-time for provider calls; plaintext exists only in memory for the duration of the request.

### Hardening recommendations
- **Key management & rotation**
  - Store `API_KEY_ENCRYPTION_KEY` in a managed secret store (Vercel/Cloud secrets).
  - Support rotation: add `encryptionKeyId` + decrypt-with-old/re‑encrypt-with-new process; run a background migration when rotating.

- **Reduce exposure**
  - Decrypt only the specific provider requested and only inside the boundary that invokes the SDK.
  - Never log keys. Keep validation logs to metadata only; add redaction for patterns like `^sk-`.

- **Operational controls**
  - Add audit events: `key_saved`, `key_removed`, `key_used` (no key material), with `userId`, `provider`, timestamp.
  - Rate limit `POST /api/user/api-key` and `DELETE /api/user/api-key`.
  - Secure cookies + HSTS; enforce HTTPS everywhere (already standard).

- **Data model & DB**
  - Keep application-layer encryption (AES) in addition to cloud EBS encryption at rest.
  - Consider envelope encryption (master key + per-record data keys) if we store many secrets.

- **Provider-side safety**
  - Encourage project-scoped keys with least privilege on provider dashboards.
  - Provide a “Revoke my key” help link and instructions per provider.

- **UX safeguards**
  - Don’t display keys after save; show status only (Configured/Not configured).
  - Validate and trim invisible characters (already implemented) and explain expected formats.

### Implementation checkpoints
- [ ] Centralize Prisma usage to `src/lib/prisma.ts` across key routes (avoid new clients).
- [ ] Add audit logs table + helpers.
- [ ] Add rate limiting middleware for key endpoints.
- [ ] Introduce `encryptionKeyId` and rotation script.
- [ ] Add log redaction utilities and CI/lint check for accidental logging of secrets.

### Relevant files
- `src/lib/encryption.ts`
- `src/app/api/user/api-key/route.ts`
- `src/app/api/user/api-key-status/route.ts`
- `prisma/schema.prisma`

This setup encrypts keys at rest, limits plaintext exposure to server memory during use, and outlines the steps to reach a production-grade security posture with rotation, auditing, and operational controls.


