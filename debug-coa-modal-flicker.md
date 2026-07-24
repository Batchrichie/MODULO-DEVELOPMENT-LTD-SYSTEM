# [OPEN] coa-modal-flicker — P0 Debug Session

## Symptom
Clicking "New account" button in AccountantCoaPage opens the Create Account modal, which then immediately collapses (closes itself on the same interaction cycle — flickers open/closed, rendering modal unusable).

## Expected
Single click → modal stays open until user clicks ×, Cancel, Save, or backdrop outside.

## Reproduction Steps (Runtime)
1. Navigate to Accountant → Chart of Accounts screen
2. Click the "New account" (teal primary) button in the header
3. Observe: modal flickers open → instantly closed on same click cycle

## Regression Window
Suspect: Modal migration work in the current working set. But AccountantCoaPage was NOT on the original migration list (AssetRegister + TaxPage only). So this could be pre-existing or a shared side-effect.

## Hypotheses (Falsifiable)
1. **H1: Outside-click listener on mount captures the same click that opened the modal** — a click-outside handler attached in mount/effect runs during the same bubble/propagation phase of the opening click and fires `setShowModal(false)`. Maps to failure pattern #1 in directive.
2. **H2: Duplicate listener from a previous open (leaked cleanup)** — two open/close listeners are registered on the second or later attempt; the closer fires immediately. Failure pattern #2.
3. **H3: Parent/button double-toggle via event bubbling** — a parent `<div>` or card-level click handler also toggles `showModal`, causing `true → false → true` (or inverse) in one event cycle. Failure pattern #3.
4. **H4: React 19 StrictMode double-effect artifact (dev-only)** — `StrictMode` double-invokes useEffect; Modal.tsx's escape-key / scroll-lock effect runs twice, potentially toggling a listener or side-effect. Test on production build vs dev. Failure pattern #4.
5. **H5: Shared Modal component effect regression on the new `onClick={backdrop}` close pattern** — The `event.target !== event.currentTarget` check in `Modal.tsx` line for `.modal-overlay` click handler has a subtle issue in the shared implementation (e.g., modal DOM elements outside `.modal` bubble an event the wrong way), or a CSS pointer-events: auto on a transparent element between overlay and content.

## Step Schedule
- [x] Hypothesize (§1)
- [ ] Bisect via git diff + log: confirm AccountantCoaPage was NOT touched (§2 of directive)
- [ ] Bisect pre- vs post-changes (§1 of directive): was flicker present before last ~hour of commits?
- [ ] Instrument CoA page setShowModal with console.trace; build repro
- [ ] Collect logs → falsify H1-H5
- [ ] Implement minimal fix
- [ ] Post-fix log comparison
- [ ] Await user confirm (fixed / still / changed) → cleanup

## Evidence Log
