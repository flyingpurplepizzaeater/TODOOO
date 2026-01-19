# Codebase Concerns

**Analysis Date:** 2026-01-19

## Tech Debt

**Bare except clause in WebSocket broadcast:**
- Issue: Silent exception swallowing masks errors and makes debugging difficult
- Files: `websocket.py` (line 46)
- Impact: Connection errors, network issues, and other problems are silently ignored; could lead to zombie connections in `active_connections` dict
- Fix approach: Catch specific exceptions (ConnectionClosed, WebSocketDisconnect) and log unexpected errors

**Deprecated `datetime.utcnow()` usage:**
- Issue: `datetime.utcnow()` is deprecated in Python 3.12+ in favor of timezone-aware datetimes
- Files: `auth.py` (line 24), `models.py` (lines 14, 24, 35, 46, 61)
- Impact: Future Python versions may remove this; timezone handling is implicit and error-prone
- Fix approach: Use `datetime.now(timezone.utc)` instead

**Temporary files polluting project root:**
- Issue: Multiple `tmpclaude-*-cwd` files and `nul` file in project root
- Files: Project root directory (50+ temp files)
- Impact: Clutters repo, potential accidental commits, wastes disk space
- Fix approach: Add `tmpclaude-*` and `nul` to `.gitignore`; clean up existing files

**SQLite database committed to repo:**
- Issue: `todo.db` file in project root
- Files: `todo.db`
- Impact: Development data in version control; merge conflicts; secrets exposure risk
- Fix approach: Add `*.db` to `.gitignore` and remove from repo

## Known Bugs

**No single-todo GET endpoint:**
- Symptoms: Cannot retrieve a single todo by ID; only list-level queries available
- Files: `routers/todos.py`
- Trigger: Frontend or API consumers needing to fetch one todo
- Workaround: Fetch entire list and filter client-side

**Team deletion allows any member to delete:**
- Symptoms: Any team member can delete the entire team, not just the creator/owner
- Files: `routers/teams.py` (lines 122-131)
- Trigger: Call `DELETE /teams/{team_id}` as any member
- Workaround: None - business logic gap

## Security Considerations

**Rate limiting scope limited to auth endpoints only:**
- Risk: Other endpoints (team creation, todo operations) have no rate limits; potential for abuse/DoS
- Files: `routers/auth.py`, `rate_limit.py`
- Current mitigation: Login (5/min), Register (3/min) rate limited
- Recommendations: Add rate limits to all mutation endpoints; consider per-user limits for authenticated routes

**WebSocket token passed in query string:**
- Risk: Token visible in server logs, browser history, and potentially proxy logs
- Files: `main.py` (line 67)
- Current mitigation: None
- Recommendations: Use WebSocket subprotocol for token or send token in first message after connection

**No JWT token revocation mechanism:**
- Risk: Compromised tokens remain valid until expiration (24h default)
- Files: `auth.py`, `config.py`
- Current mitigation: 24-hour expiration
- Recommendations: Implement token blacklist or short-lived tokens with refresh tokens

**SECRET_KEY fallback generates random key:**
- Risk: In development without .env, sessions invalidate on restart; could mask production misconfiguration
- Files: `config.py` (lines 15-24)
- Current mitigation: RuntimeWarning issued
- Recommendations: Fail fast in production if SECRET_KEY not set (check environment)

**No CORS configuration:**
- Risk: API currently allows same-origin only; may break if frontend hosted separately
- Files: `main.py`
- Current mitigation: Not configured (restrictive by default)
- Recommendations: Add explicit CORS configuration before deploying frontend separately

**No HTTPS enforcement:**
- Risk: Tokens transmitted in cleartext over HTTP
- Files: `main.py`, `Dockerfile`
- Current mitigation: None
- Recommendations: Add HTTPS redirect middleware or deploy behind reverse proxy with TLS

## Performance Bottlenecks

**N+1 query pattern in todo listing:**
- Problem: Each todo loads assignee separately via relationship
- Files: `routers/todos.py` (line 74)
- Cause: `selectinload(TodoItem.assignee)` issues additional query per unique assignee
- Improvement path: Already using selectinload which batches; acceptable for current scale

**In-memory WebSocket connection tracking:**
- Problem: All WebSocket connections stored in Python dict; no persistence or distribution
- Files: `websocket.py`
- Cause: Single-server architecture assumed
- Improvement path: Move to Redis pub/sub for multi-server deployments

**SQLite default database:**
- Problem: SQLite unsuitable for production concurrent writes
- Files: `config.py` (line 11), `docker-compose.yml`
- Cause: Development convenience
- Improvement path: Document PostgreSQL requirement for production; update docker-compose

## Fragile Areas

**WebSocket connection manager state:**
- Files: `websocket.py`, `main.py` (lines 63-100)
- Why fragile: Mutable shared state (`active_connections` dict); bare except clause; no connection health checks
- Safe modification: Add comprehensive error handling before changing broadcast logic
- Test coverage: Good (test_websocket.py covers connect/disconnect/broadcast scenarios)

**Team membership verification scattered across routers:**
- Files: `routers/teams.py` (line 20-28), used in `routers/lists.py`, `routers/todos.py`
- Why fragile: Authorization logic duplicated via function calls; easy to forget in new endpoints
- Safe modification: Consider middleware or decorator pattern
- Test coverage: Good (403 tests exist for unauthorized access)

**Database initialization in lifespan:**
- Files: `main.py` (lines 17-20), `database.py` (lines 11-13)
- Why fragile: `Base.metadata.create_all` runs on every startup; conflicts with Alembic migrations
- Safe modification: Remove auto-creation; rely solely on Alembic
- Test coverage: Tests override database anyway

## Scaling Limits

**Single-process WebSocket:**
- Current capacity: Hundreds of concurrent connections per server
- Limit: Thousands of connections will exhaust memory; cross-server messaging impossible
- Scaling path: Implement Redis pub/sub adapter for ConnectionManager

**SQLite file locking:**
- Current capacity: ~100 concurrent reads, 1 write at a time
- Limit: Multiple concurrent writes will fail with database locked errors
- Scaling path: Migrate to PostgreSQL using existing `asyncpg` support in DATABASE_URL

## Dependencies at Risk

**python-jose maintenance status:**
- Risk: python-jose has had security vulnerabilities; PyJWT is more actively maintained
- Impact: JWT handling security
- Migration plan: Replace with `PyJWT` library; API is similar

**passlib bcrypt backend:**
- Risk: passlib is in maintenance mode; bcrypt library preferred directly
- Impact: Password hashing
- Migration plan: Use `bcrypt` library directly or migrate to `argon2-cffi`

## Missing Critical Features

**No password reset/recovery:**
- Problem: Users cannot recover accounts if password forgotten
- Blocks: Self-service account recovery; requires manual intervention

**No email verification:**
- Problem: Email addresses not verified at registration
- Blocks: Cannot trust email for notifications or recovery

**No team roles/permissions:**
- Problem: All team members have equal permissions (including delete team)
- Blocks: Safe team management; any member can destroy team

**No audit logging:**
- Problem: No record of who did what when
- Blocks: Compliance requirements; debugging production issues

**No pagination:**
- Problem: List endpoints return all records
- Blocks: Handling teams/lists/todos at scale

## Test Coverage Gaps

**WebSocket real-time update broadcasts:**
- What's not tested: Broadcasting list/todo changes to connected WebSocket clients
- Files: `websocket.py` (broadcast method), `routers/todos.py`, `routers/lists.py`
- Risk: Todo/list mutations don't trigger WebSocket updates; feature may be incomplete
- Priority: High - core feature for "collaborative" functionality

**Rate limiter bypass via headers:**
- What's not tested: X-Forwarded-For header manipulation to bypass IP-based rate limiting
- Files: `rate_limit.py`, `routers/auth.py`
- Risk: Rate limits ineffective behind proxy if not configured properly
- Priority: Medium - security concern

**Database migration rollback:**
- What's not tested: Alembic downgrade path
- Files: `alembic/versions/001_initial_schema.py`
- Risk: Cannot safely roll back schema changes
- Priority: Low - downgrade rarely needed

**Concurrent modification handling:**
- What's not tested: Two users modifying same todo simultaneously
- Files: `routers/todos.py`
- Risk: Last-write-wins with no conflict detection
- Priority: Medium - collaborative app should handle conflicts

---

*Concerns audit: 2026-01-19*
