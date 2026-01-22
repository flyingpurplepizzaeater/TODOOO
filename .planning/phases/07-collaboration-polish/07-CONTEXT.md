# Phase 7: Collaboration Polish - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users have full awareness of collaborators' activity. Cursors with username labels appear in real-time, and a presence indicator shows who's online. This phase adds visual collaboration features — not editing permissions, chat, or commenting.

</domain>

<decisions>
## Implementation Decisions

### Cursor Appearance
- Auto-assigned distinct colors from palette (system picks to maximize contrast)
- Dot/circle shape (not arrow pointer)
- Medium size (16-20px) for clear visibility without dominance
- Username label appears on hover only — keeps canvas clean by default

### Presence Panel
- Sidebar layout (not floating panel or toolbar integration)
- Displays avatar + username for each connected user
- Adaptive default: collapsed on mobile, open on desktop
- Color border on avatar matches user's cursor color

### Idle Behavior
- Cursor fades after 30 seconds of inactivity
- User marked as idle in presence panel after 2 minutes
- Idle users appear dimmed/grayed in the sidebar list
- Instant restore when idle user becomes active again (no fade-in)

### Interaction Feedback
- Follow mode: click avatar in presence panel to follow their viewport
- Following indicated by: toast notification on start + colored border around viewport while following
- Stop following: either pan/zoom manually OR click explicit button
- Objects selected by others show colored selection outline (their cursor color)

### Claude's Discretion
- Which side of screen for presence sidebar (left vs right based on existing layout)
- Exact color palette for cursor assignment
- Animation timing for cursor fade
- Toast notification styling and duration

</decisions>

<specifics>
## Specific Ideas

- Cursors should feel unobtrusive — dot/circle is less visually heavy than arrows
- "Following" border should match the followed user's cursor color for visual consistency
- Idle dimming in sidebar helps distinguish active collaborators at a glance

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-collaboration-polish*
*Context gathered: 2026-01-22*
