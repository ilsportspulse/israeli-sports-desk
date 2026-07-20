# ILSP API contracts

These version-1 contracts are the shared public boundary for the website and future mobile clients. They expose published editorial fields, explicit locale and media metadata, and canonical score-event shapes. They deliberately exclude source maps, review state, confidence, internal notes, provider provenance and assistance disclosures.

Changes are additive within version 1. Removing a field, changing its meaning or narrowing an enum requires a new major contract version. Representative fixtures are tested before the website endpoint or mobile prototype may consume a change.

The current score fixture proves the neutral multi-sport event shape only. It does not activate a score provider or imply that a competition is licensed.
