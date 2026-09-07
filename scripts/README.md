# Scheme generation

`generate-scheme.py` rebuilds `src/scheme/scheme.ts` from the two source
documents. Run it only if the scheme itself changes.

```bash
pip install python-docx openpyxl

python3 scripts/generate-scheme.py             # reads ~/Downloads by default
python3 scripts/generate-scheme.py ~/somewhere-else
```

It writes `src/scheme/scheme.ts` directly. It reads:

- `Our role sizing scheme v2.docx` — factor and level criteria, and the points
  for each level.
- `JE Scheme Database 2022.xlsx` — the *Factor Breakdown* sheet for short level
  headings and the "what does this mean?" text, and the *Points* sheet, which
  every point value is asserted against.

The script raises rather than guessing if a factor gains or loses a level, so a
changed scheme fails loudly instead of quietly producing wrong totals. The
`BLOCKS` table maps each factor to the cells its levels live in and is the part
that needs updating when the workbook's layout moves.

