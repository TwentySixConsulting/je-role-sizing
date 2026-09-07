# Setup

## Sign-in without a backend (what the live site uses now)

Usernames and passwords are baked in at build time from a repository secret.

```bash
./scripts/make-user-hashes.sh millie:somepassword jane:anotherpassword
gh secret set VITE_APP_USERS --repo TwentySixConsulting/je-role-sizing --body '<the printed line>'
```

Push anything to `main` (or run the workflow manually) and the new credentials
are live. Passwords are stored as SHA-256 hashes, so the built JavaScript does
not contain them in the clear.

**What this is and is not.** A static site has to ship whatever it checks
against, so a determined person can read past this. It stops the tool being
casually usable by anyone who stumbles on the URL. It does not protect the
job descriptions, because there is nothing server-side to enforce it. For that,
read on.

---

## Shared team storage, and a login that actually holds

This is the step that gives every consultant one shared library **and** turns
the password into something enforced by a database rather than by the page.

You already have a Supabase project, `lcvxhbczeougiflcywqt`, but it is the
**TwentySix Benefits** one. Everything here is namespaced `je_`, so it can sit
alongside those tables safely. A separate project is tidier — role sizing holds
confidential client job descriptions, and keeping them apart means a key
rotation or a mistake on one tool cannot touch the other — but reusing the
existing one works and needs no new account.

### 1. Create the tables

No CLI login needed. In the Supabase dashboard for whichever project:
**SQL Editor → New query**, paste the whole of
`supabase/migrations/0001_je_role_sizing.sql`, and run it.

That creates `je_roles`, `je_settings`, a private `je-job-descriptions` storage
bucket, and the row level security policies. It is additive and safe to re-run.

### 2. Create an account per consultant

From **Project Settings → API**, take the URL and the service role key:

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
./scripts/create-users.sh millie:somepassword jane:anotherpassword
```

Consultants then sign in with just `millie`. The script completes it to
`millie@twentysixconsulting.co.uk` behind the scenes, which is what
`VITE_TEAM_EMAIL_DOMAIN` controls.

Keep the service role key out of the app and out of repository secrets — it
bypasses row level security.

### 3. Point the deployed site at it

From **Project Settings → API**, take the URL and the *publishable* (anon) key:

```bash
gh secret set VITE_SUPABASE_URL      --repo TwentySixConsulting/je-role-sizing --body 'https://<ref>.supabase.co'
gh secret set VITE_SUPABASE_ANON_KEY --repo TwentySixConsulting/je-role-sizing --body '<anon key>'
gh secret delete VITE_APP_USERS      --repo TwentySixConsulting/je-role-sizing
gh workflow run deploy.yml           --repo TwentySixConsulting/je-role-sizing
```

Removing `VITE_APP_USERS` is deliberate: with Supabase set, sign-in switches to
real accounts and the build-time list is no longer used.

### 4. Check it

Open the link, sign in, add a role, and confirm the row appears in the Supabase
table editor. Open the link in a second browser as a different consultant and
you should see the same role.

---

## Why the password becomes real once step 2 is done

The publishable key ships in the built JavaScript, as it does in any Supabase
app, so it cannot be what keeps people out. It isn't:

- `je_roles` and `je_settings` have row level security on, with policies granted
  only to the `authenticated` role. There is **no policy for `anon`**, so the
  key on its own returns nothing.
- The storage bucket holding the original Word and PDF files is private, with
  the same `authenticated`-only policy.
- Passwords are checked by Supabase, never by the page, so editing the
  JavaScript gets you nowhere.

Individual accounts also mean the "scored by" name on a report is the account
that did the work, rather than whatever someone typed in Settings.

## Things worth knowing once it is shared

- **Deleting is for everyone.** "Delete everything" in Settings clears the
  shared library. Take a Backup first.
- **Two people, same role, same moment.** Writes only touch the columns that
  changed, so two consultants on different roles, or on different factors of the
  same role, never overwrite each other. Two people changing the *same* factor
  in the same second is last-write-wins.
- **Contribution bands are shared**; the evaluator name and list sort stay per
  person, in their own browser.
