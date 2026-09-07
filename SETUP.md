# Setup: shared team storage and a link

The app is finished and works either way:

- **No Supabase configured** → browser-only storage, a "Local copy" badge in the
  header, nothing shared.
- **Supabase configured** → one shared team library, a password box on load, and
  changes appearing live for whoever else has it open.

These are the steps to get the second one, plus a URL to send the team.

---

## 1. Choose a Supabase project

You already have a project, `lcvxhbczeougiflcywqt`, but it is the **TwentySix
Benefits** one (six benefits tables). Everything here is namespaced `je_`, so it
would sit alongside them without colliding.

**A separate project is worth it.** Role sizing holds confidential client job
descriptions, which is a different class of data from public benefits research,
and keeping them apart means a key rotation, a paused project or a mistake on
one tool cannot touch the other.

```bash
supabase login          # one-time, opens a browser
supabase projects create twentysix-role-sizing --org-id <your-org-id> --region eu-west-2
supabase projects list   # note the new project ref
```

To reuse the Benefits project instead, skip straight to step 2 with its ref.

## 2. Create the tables

Either paste `supabase/migrations/0001_je_role_sizing.sql` into the project's
**SQL Editor** and run it, or:

```bash
supabase link --project-ref <ref>
supabase db push
```

That creates `je_roles`, `je_settings`, a private `je-job-descriptions` storage
bucket, and the row level security policies. It is additive and safe to re-run.

## 3. Create the shared team account

The password box signs in one account. Create it with the project's service role
key (Project Settings → API):

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
TEAM_EMAIL=rolesizing@twentysixconsulting.co.uk \
./scripts/create-team-user.sh 'the-password-you-want'
```

Re-run it any time to change the password. The service role key must never go
into the app or into Vercel's client-side variables — it bypasses row level
security. `.gitignore` already excludes `.env.local` and `.vercel`.

## 4. Point the app at it

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TEAM_EMAIL
npm run dev
```

The password box should appear. Sign in and add a role; you should see it in the
Supabase table editor.

## 5. Deploy

```bash
vercel login            # your existing token has expired
vercel link
vercel env add VITE_SUPABASE_URL      production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_TEAM_EMAIL        production
vercel --prod
```

That prints the URL to send the team. `vercel.json` already sets the SPA rewrite
and `noindex` so the tool never turns up in a search result.

---

## How the password actually protects anything

The `anon` key ships in the built JavaScript, as it does in any Supabase app, so
it cannot be the thing keeping people out. It isn't:

- `je_roles` and `je_settings` have row level security on, with policies granted
  only to the `authenticated` role. There is **no policy for `anon`**, so the key
  on its own returns nothing.
- The storage bucket is private, with the same `authenticated`-only policy.
- The password is the shared account's Supabase Auth password. It is checked by
  Supabase, never by the page, so it cannot be bypassed by editing the
  JavaScript.

What it does not do: everyone shares one account, so the report's "evaluated by"
field is whatever each consultant typed in Settings, on trust. If you later need
that to be provably theirs, move to individual logins — the change is one
policy and swapping the password box for an email field.

## Things worth knowing

- **Deleting is for everyone.** "Delete everything" in Settings clears the shared
  library. Take a Backup first.
- **Two people, same role, same moment.** Writes only touch the columns that
  changed, so two consultants on different roles, or on different factors of the
  same role, never overwrite each other. Two people changing the *same* factor
  at the same second is last-write-wins.
- **Evaluator name and list sort stay local** to each consultant. Contribution
  bands are shared, so changing them changes them for the team.
- **Backups still work**, and are the way to hand a subset of roles to someone
  outside the team or to keep a point-in-time copy.
