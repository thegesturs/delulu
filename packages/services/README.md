# Services

Cross-runtime business capabilities live here as `Context.Service` classes.
The API Worker will construct request-scoped layers after authentication so
services receive the current principal and workspace as data. The Lambda
worker will build infrastructure layers once at cold start and provide
job-specific context for each invocation. Applications and client packages do
not compose these layers; they consume the contract-derived HTTP client.

`FoundationService` is intentionally behavior-free scaffolding. Domain
services arrive in M2.
