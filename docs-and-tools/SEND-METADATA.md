# Sending the Arabic metadata to Kata — `methodica-ar-science-mass-gas-01`

`send-metadata.ps1` is the `methodica-ar-science-mass-liquid-02` copy (2026-11-02), retargeted to this unit.

> ⚠️ **No `-Publish` without MOE's written approval of the Arabic version.**
> The Arabic components join the already-approved Hebrew unit. Publishing them there approves them
> automatically, without MOE ever testing them (`Documentation/KATA/KATA-API.md`, "Arabic components
> in a Hebrew unit", rule of 2026-11-02). Record the approval (who, when, where) in the log table
> below **before** any `-Publish`.

## Parent-unit mode

- **There is no Arabic unit in Kata.** Kata binds a learning objective to exactly one unit, so the six
  Arabic components are created inside the Hebrew unit `methodica-science-mass-gas-01`.
- `-ParentUnitKey` defaults to `methodica-science-mass-gas-01`.
- **The parent unit is GET-only:** `*_unit.json` is not sent, and nothing is PATCHed on the unit.
- `-ParentUnitKey ''` would restore the own-unit upsert. **Do not use it for this unit.**
- **Component ids** look like `https://lomdot.education.gov.il/metodica/720/ar/science/mass-gas/01/methodica-ar-science-mass-gas-01-0N/`.
- **`ContentBaseUrl`** is `https://lomdot.education.gov.il/metodica/720/ar/science/mass-gas/01`.
  - `hostedContentRef` = `<base>/<component>/index.html`.
  - **The hosting path must be confirmed by the unit owner before the first live run.** `hostedContentRef` is effectively one-way.
- **Title key** is `ar` (`KATA-API.md`, rule of 2026-10-19).
- **`recommendedAfterFail`:** 03 → 02, as in the Hebrew unit.

## Order

Each step needs Vadim's go:

1. `pwsh -File send-metadata.ps1 -DryRun`. Writes nothing to Kata.
2. `pwsh -File send-metadata.ps1 -Preflight`. Read-only. The parent unit must exist, and each Arabic component is expected to be absent (404).
3. **Live create.** The components arrive as `draft`.
4. Read-back: `pwsh -File retrieve-metadata.ps1 -OutDir <scratch>`. Then a semantic diff against `metadata/` that ignores timestamps, slug vs IRI, a trailing `/` and order. Kata's `correctXapiResponsesPattern` goes into `_test/kata-patterns.json`.
5. `pwsh -File send-metadata.ps1 -Status`. Read-only; expect 6 × `draft`.
6. `-Publish`. **Only after MOE's written approval** (see the top of this file).

The API key is read from `docs-and-tools/kata-api-key.txt` or `kata-api-key.txt`. Both are git-ignored and never shipped. The key is never printed.

## Log

| Date | Step | Result |
|---|---|---|
| — | — | Nothing sent yet (2026-11-15). |
