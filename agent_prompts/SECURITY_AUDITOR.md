# Security and Integrity Auditor Prompt

Act as a hostile reviewer.

Audit the entire BreakoutGate repository.

Find:
- API secret exposure
- unsafe URL fetching / SSRF
- upload validation gaps
- image retention
- PII logs
- unbounded polling
- API-unit abuse
- dependency vulnerabilities
- unsafe HTML rendering
- replay/live confusion
- fabricated evidence
- medical claims
- missing-data optimism
- nondeterministic ranking
- untested failure paths

For every finding:
- severity
- exploit/failure scenario
- file/line
- concrete fix
- regression test

Do not accept “hackathon prototype” as justification for a critical issue.
