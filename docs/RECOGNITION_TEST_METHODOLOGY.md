# Recognition test methodology

The recognition workspace on Brand Intelligence stores a response only after a person consents and submits it.

A session needs a consent checkbox. The stimulus is the name and ticker currently in the form. It stays visible for 5,000 ms, then hides. Display time is `performance.now()` around that timer when the browser provides it. Restart clears the stimulus and does not save the interrupted attempt.

The person then enters a remembered name, ticker, and meaning, and may enter clarity and memorability from 1 to 5.

Rates use completed rows only:

- Exact name: trimmed case-insensitive match.
- Exact ticker: trimmed case-insensitive match.
- Normalized name: letters and digits only.
- Meaning: a non-empty meaning, not a judgment that the meaning is correct.

An empty store has null rates. The note says a sample under 30 is too small for a significance claim. A larger sample in this browser is still not a population estimate.

If the same session label already completed that candidate, the page asks before showing it again. A repeat is not treated as an independent first impression.

CSV import sets `source` to `imported`. Export includes the source column. There is no device fingerprint. A shared backend for many participants is not deployed, so local rows are not described as a crowd study.

The older “Show for 5 seconds” control remains for a single typed response. Its rate is separate and still uses only saved responses.
