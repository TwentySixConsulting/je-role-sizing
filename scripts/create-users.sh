#!/usr/bin/env bash
# Creates (or resets the password of) one Supabase Auth account per consultant.
# Only needed once the shared team database is switched on - see SETUP.md.
#
#   SUPABASE_URL=https://xxxx.supabase.co \
#   SUPABASE_SERVICE_ROLE_KEY=... \
#   ./scripts/create-users.sh millie:somepassword jane:anotherpassword
#
# A bare username becomes <username>@$TEAM_EMAIL_DOMAIN, matching what the
# sign-in screen does, so consultants only ever type the username.
#
# The service role key bypasses row level security. Keep it out of the app, out
# of repository secrets, and out of git.

set -euo pipefail

TEAM_EMAIL_DOMAIN="${TEAM_EMAIL_DOMAIN:-twentysixconsulting.co.uk}"

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 username:password [username:password ...]" >&2
  exit 1
fi
: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY}"

api="${SUPABASE_URL%/}/auth/v1/admin/users"
auth=(-H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")

existing_json=$(curl -sS "${auth[@]}" "${api}?page=1&per_page=1000")

for pair in "$@"; do
  user="${pair%%:*}"
  pass="${pair#*:}"
  if [[ "$user" == "$pair" || -z "$pass" ]]; then
    echo "Expected username:password, got '$pair'" >&2
    exit 1
  fi
  if [[ ${#pass} -lt 10 ]]; then
    echo "Password for '$user' is under 10 characters." >&2
    exit 1
  fi

  email="$user"
  [[ "$email" == *@* ]] || email="${user}@${TEAM_EMAIL_DOMAIN}"
  email=$(printf '%s' "$email" | tr '[:upper:]' '[:lower:]')

  id=$(printf '%s' "$existing_json" | EMAIL="$email" python3 -c "
import json, os, sys
email = os.environ['EMAIL']
users = json.load(sys.stdin).get('users', [])
print(next((u['id'] for u in users if (u.get('email') or '').lower() == email), ''))
")

  if [[ -n "$id" ]]; then
    curl -sS -X PUT "${auth[@]}" -H 'Content-Type: application/json' \
      -d "$(P="$pass" python3 -c "import json,os;print(json.dumps({'password':os.environ['P']}))")" \
      "${api}/${id}" > /dev/null
    echo "Reset password for ${email}"
  else
    curl -sS -X POST "${auth[@]}" -H 'Content-Type: application/json' \
      -d "$(E="$email" P="$pass" python3 -c "
import json, os
print(json.dumps({'email': os.environ['E'], 'password': os.environ['P'], 'email_confirm': True}))")" \
      "$api" | EMAIL="$email" python3 -c "
import json, os, sys
r = json.load(sys.stdin)
if r.get('id'): print('Created', r['email'])
else: sys.exit('Failed for ' + os.environ['EMAIL'] + ': ' + json.dumps(r))
"
  fi
done

echo
echo "Consultants sign in with just the username part, e.g. 'millie'."
