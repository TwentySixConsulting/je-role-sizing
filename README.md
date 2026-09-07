# Role Sizing

A consultant's tool for sizing roles against the TwentySix role sizing scheme.
Read the job description on one side, work through the eleven factors on the
other, and get the points total and contribution band at the end.

Everything runs in the browser. Nothing is uploaded anywhere, so client job
descriptions never leave the machine.

## Running it

```bash
npm install
npm run dev      # http://localhost:5180
```

To build a static copy you can host or open from a shared folder:

```bash
npm run build    # writes dist/
npm run preview
```

The build uses relative paths, so `dist/` works from a subdirectory (GitHub
Pages, an internal server, a network share).

## What it does

**Add a role.** Drop in Word (.docx), PDF or plain text job descriptions - one
at a time, or a whole structure at once. The text is pulled out in the browser
(mammoth for Word, pdf.js for PDF) and stored with the role, and the original
file is kept so you can reopen it later. There is also a paste-it-in route for
when you only have an email.

Scanned PDFs have no text layer and will say so rather than silently storing
nothing. Old binary `.doc` files cannot be read in a browser; re-save as .docx
or PDF.

**Score it.** Split screen: description on the left, factors on the right. Each
level shows its full scheme criteria and, where it adds something, the "what
does this mean?" expansion. Click a level and it advances to the next factor.
Keys `1`-`8` pick a level, `←`/`→` move between factors. Drag the divider to
change the balance of the two panes.

*Cue words* tints phrases in the description that often bear on the factor you
are on - "budget", "coaching", "ambiguous" and so on. It is a way of finding the
relevant paragraph faster. It never suggests or affects a level.

Each factor has a free-text box for why you chose that level. Optional, but it
is what defends the score in a year's time.

**See the outcome.** Total points, contribution band, how far into the band the
role sits and how many points would tip it into the next one, the split across
the four cornerstones, and a factor-by-factor profile. Click any factor in the
profile to go back and change it.

**Check it.** Where an organisation has other fully scored roles, factors that
sit two or more levels from the median are flagged as worth a second look. Not
wrong, just unusual - and worth being able to explain. The Compare screen puts
up to five roles side by side, factor by factor, tinting cells that sit away
from the row's middle.

**Browse the library.** Roles are grouped by organisation and ranked by points,
highest first by default, reversible. Expand any role to read its job
description beside its score profile.

**Get it out.** A printable report per role (print to PDF from the browser), a
CSV shaped like the JE Scheme Database workbook, a rationale CSV with one row
per factor and the reason recorded, and a JSON backup that restores into another
browser - which is how you hand work to a colleague.

## The scheme

`src/scheme/scheme.ts` is **generated**, not hand-written. It was built from:

- `Our role sizing scheme v2.docx` - the factor and level criteria, and the
  points for each level.
- `JE Scheme Database 2022.xlsx`, *Factor Breakdown* sheet - the short level
  headings and the "what does this mean?" text.
- `JE Scheme Database 2022.xlsx`, *Points* sheet - used to cross-check every one
  of the 72 level point values. All 72 matched.

Contribution bands come from the same workbook's *Points* sheet and are editable
in Settings, so a client's own structure can be used instead.

The scheme's arithmetic range is **240 to 1,645 points** - 240 because every
factor must carry a level, so nothing can score zero.

### One discrepancy worth knowing about

The workbook's *Points* sheet gives Context & Impact a level 7 worth 210 points,
but the scheme document defines only six levels for that factor, with no level 7
criteria. This tool follows the scheme document: **Context & Impact has six
levels.**

Two things support that reading. The workbook's own lookup formulas are
inconsistent about it, and with six levels the maximum total is 1,645, which
sits just inside the top band's published ceiling of 1,650. With a seventh level
the maximum would be 1,855 and overflow every band.

The workbook's *Contributions* sheet also states a maximum of 1,665 built from
Building Relationships capped at 60 and Context & Impact at 210. Both the scheme
document and the Points sheet disagree: Building Relationships has a level 7
worth 70, and Context & Impact tops out at 180. That sheet appears to be stale.

If you decide Context & Impact should have a seventh level, add it to
`src/scheme/scheme.ts` with its criteria text and everything else follows.

## Where the data lives

Two modes, chosen automatically by whether the Supabase environment variables
are set:

**Shared (production).** Roles, scores, reasons and uploaded job descriptions
live in TwentySix's own Supabase project. Every consultant who types the team
password sees the same library, and a colleague's changes appear without a
reload. Row level security grants access only to an authenticated session, so
the publishable key shipped in the JavaScript reads nothing on its own — the
password is enforced by the database. See `SETUP.md`.

**Local (no Supabase configured).** Everything stays in this browser's
IndexedDB and a "Local copy" badge appears in the header. Useful for
development, and it means the app still starts if the environment variables are
missing rather than showing an error.

`src/lib/backend.ts` is the seam: one interface, two implementations
(`backendLocal.ts`, `backendSupabase.ts`). Nothing above it knows which is in
use.

Either way, **Backup** writes a JSON file and **Restore** loads one, which is
how you keep a point-in-time copy or hand a set of roles to someone outside the
team. A restore overwrites any role with a matching id and leaves the rest
alone.

## Layout

```
src/
  scheme/scheme.ts        generated scheme content (do not hand-edit lightly)
  scheme/bands.ts         contribution bands and the band-proximity maths
  lib/backend.ts          the storage interface both backends implement
  lib/backendSupabase.ts  shared team database + storage + realtime
  lib/backendLocal.ts     browser-only fallback
  lib/db.ts               IndexedDB primitives and per-person settings
  lib/supabase.ts         client setup from environment variables
  lib/auth.tsx            the shared team password gate
  lib/store.tsx           React state over the database
  lib/scoring.ts          totals, cornerstone splits, outlier detection
  lib/extract.ts          .docx / .pdf / text extraction
  lib/cues.ts             per-factor cue words for the reading aid
  lib/exportImport.ts     CSV, rationale CSV, JSON backup and restore
  components/             UI kit, charts, level picker, description reader
  views/                  SignIn, Library, NewRole, Evaluate, Report, Compare,
                          SchemeReference, Settings
supabase/migrations/      the schema, RLS policies and storage bucket
```

### Chart colours

The four cornerstone colours are a categorical palette validated against the
cream chart surface for lightness band, chroma, colourblind separation under
protan/deutan/tritan simulation, normal-vision separation and contrast, across
all pairs rather than just adjacent ones. Every use is directly labelled, which
is the required relief for the aqua slot sitting just under 3:1 against the
background. If you change them, revalidate rather than eyeballing it.

## Regenerating the scheme

See `scripts/README.md`. The generator is deterministic: running it against the
same two source documents reproduces `src/scheme/scheme.ts` byte for byte.
