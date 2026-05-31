# Frontend v2 Auth0 Setup Evidence

Date: 2026-06-01
Repo: `A:\Photo_Studio_OS_Frontend`
Related task: `T129-003 Auth0 Tenant And App Setup Checklist`

This file is the sanitized intake sheet for Auth0 setup evidence. It must not
contain raw access tokens, ID tokens, refresh tokens, passwords, client secrets,
Auth0 management API tokens, or screenshots containing credential-bearing
values.

## Current Status

| Field | Status |
|---|---|
| Auth0 setup evidence decision | Provided |
| Live frontend login verified | Verified locally 2026-06-01 |
| Backend Auth0 smoke verified | Verified locally 2026-06-01 |
| Raw token recorded | No |

## Local Live Smoke Result

Local Auth0 smoke was completed on 2026-06-01 with sanitized evidence only.

| Field | Evidence |
|---|---|
| Environment | local |
| Frontend origin | `http://127.0.0.1:5173` |
| Backend base URL | `http://127.0.0.1:3001/api/v1` |
| API audience | `https://photo-studio-os-api` |
| User-delegated API access | Granted to `Photo Studio OS Frontend` |
| Raw token recorded | No |
| Token cleanup | `TOKEN_CLEARED` |
| Auth source | `auth0` |
| Provider | `auth0` |
| Role claim | `owner` |
| RBAC probe: reviews:read | expected `200`, actual `200`, decision `allowed`, passed `true` |
| RBAC probe: projects:write | expected `200`, actual `200`, decision `allowed`, passed `true` |
| Smoke exit status | `0` |
| Result | `AUTH0_LIVE_SMOKE_PASSED` |

## Non-Secret Values To Record

Fill these only after Auth0 dashboard setup is complete. Use sanitized values or
the word `present`; do not paste secrets.

| Item | Evidence |
|---|---|
| Auth0 tenant domain | `dev-2n3z8xing6eekyok.us.auth0.com` |
| SPA client ID | `1rU1X0nHkjrvpg043fS5GasaSpQBt8C9` |
| API audience | `https://photo-studio-os-api` |
| Allowed callback URL includes local frontend | Yes: `http://127.0.0.1:5173` |
| Allowed logout URL includes local frontend | Yes: `http://127.0.0.1:5173` |
| Allowed web origin includes local frontend | Yes: `http://127.0.0.1:5173` |
| Post-Login Action deployed | Yes: `Photo Studio OS Claims` deployed and attached to Post Login flow |
| Owner smoke user configured | Yes: `psos-owner-smoke@example.com` with `photo_studio_role=owner` |
| Retoucher smoke user configured | Yes: `psos-retoucher-smoke@example.com` with `photo_studio_role=retoucher` |
| Client reviewer smoke user configured | Yes: `psos-client-reviewer-smoke@example.com` with `photo_studio_role=client_reviewer` |

## Local Frontend Callback Values

Expected local allowlist values:

```text
Allowed Callback URLs: http://127.0.0.1:5173
Allowed Logout URLs: http://127.0.0.1:5173
Allowed Web Origins: http://127.0.0.1:5173
```

## Required Claims

The Auth0 Post-Login Action must place these claims in the access token:

```text
https://photo-studio-os/organization_id
https://photo-studio-os/role
```

First-smoke role claim values:

```text
owner
retoucher
client_reviewer
```

## Evidence Recorded

The Auth0 dashboard setup is complete for local smoke. The recorded non-secret
evidence is:

```text
tenant domain: present or sanitized domain value
SPA client ID: present
API audience: https://photo-studio-os-api
local callback configured: yes
local logout configured: yes
local web origin configured: yes
Post-Login Action deployed: yes
owner smoke user configured: yes
retoucher smoke user configured: yes
client_reviewer smoke user configured: yes
```

Do not record:

```text
raw access tokens
ID tokens
refresh tokens
passwords
client secrets
Auth0 management API tokens
credential-bearing screenshots
```

## Next Gate

The next gate is not production readiness. Before staging or production auth
signoff, the project still needs:

- an approved non-production staging Backend URL;
- a staging Auth0 smoke with no raw token recorded;
- backend-owned role enforcement evidence for read-model endpoints in staging;
- explicit production auth, deploy, and release approval before any production
  use.
