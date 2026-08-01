# HIVE Deployment

## Environments

### Local

Purpose:
Development

### Staging

Purpose:
QA and stakeholder validation.

### Production

Purpose:
Internal HIMARK use.

---

## Stack

Frontend
- Next.js
- Vercel

Backend
- Supabase

Database
- PostgreSQL

Storage
- Supabase Storage

---

## CI/CD

Developer
→ GitHub
→ Lint
→ Type Check
→ Tests
→ Build
→ Deploy Preview
→ Approval
→ Production

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_STORAGE_BUCKET
```

Never expose the service role key to the browser.

---

## Release Checklist

- Tests passing
- Documentation updated
- No lint errors
- No TypeScript errors
- Database migrations applied
- Environment variables verified
- Rollback plan confirmed

---

## Rollback

If a production release fails:

1. Revert deployment.
2. Restore previous production build.
3. Validate authentication.
4. Validate database migrations.
5. Reopen deployment after fixes.

---

## Monitoring

Track:

- Build failures
- Runtime errors
- Authentication failures
- Storage failures
- Database performance
- User-reported issues

Deployment should always prioritise stability over release speed.
