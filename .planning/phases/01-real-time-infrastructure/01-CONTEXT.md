# Phase 1: Real-Time Infrastructure - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend supports real-time CRDT synchronization for collaborative editing. Two browser windows sync within 200ms, reconnection restores sync without data loss, boards accessible via shareable URLs with permissions.

</domain>

<decisions>
## Implementation Decisions

### Conflict Handling
- Incompatible edits create duplicate objects (e.g., both users move same object to different places)
- Compatible edits merge silently (e.g., one user changes color, another changes position)
- Duplicate objects are tagged for deletion to prevent cascading duplicates
- Both conflicting users must acknowledge/accept before a duplicate is deleted (consensus model)
- Conflict duplicates visible to all users on the board, not just involved parties

### Connection Behavior
- Subtle indicator when connection is lost (small icon/status dot) — non-intrusive
- Offline edits allowed — changes queue locally and sync when reconnected
- On reconnect, briefly highlight objects that changed while user was offline
- Aggressive reconnection: immediate retry, then exponential backoff (1s, 2s, 4s...) up to 30s

### Room/Board Lifecycle
- Continuous persistence — every change persists immediately to database
- Rooms kept in memory even when inactive (faster rejoining)
- Explicit "New Board" action required to create boards (no auto-create from URL)
- Only board owner can delete a board

### Sharing & Permissions
- Three permission levels: View only, Comment (no drawing), Edit (full access)
- Team boards require authentication; public boards open to anyone with link
- Board owner can upgrade/downgrade/revoke user access anytime
- Full audit log: who accessed, when, what permission level

### Claude's Discretion
- Exact CRDT data structure for conflict detection
- How to identify "incompatible" vs "compatible" edits technically
- Offline queue implementation details
- Audit log storage format and retention

</decisions>

<specifics>
## Specific Ideas

- Conflict resolution requires consensus — both parties must agree to delete a duplicate
- This prevents one user from unilaterally overwriting another's work
- Offline experience should feel seamless — users shouldn't feel punished for bad connections

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-real-time-infrastructure*
*Context gathered: 2026-01-19*
