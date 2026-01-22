# Phase 8: Mobile Platform - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Native iOS and Android app wrappers via Capacitor. Touch gesture support for canvas interactions. All Phase 2-6 features must work in mobile apps without degradation.

</domain>

<decisions>
## Implementation Decisions

### App Identity & Branding
- App name: **TODOOO** (displayed on home screen)
- Icon style: Illustrated (detailed whiteboard/task imagery)
- Primary brand color: Teal
- Splash screen: Animated loading animation (brief, e.g., checkmark drawing)

### Touch Interactions
- Two-finger pan, one-finger draw (default draw mode)
- Stylus behavior: Pressure sensitivity for stroke width + stylus draws while finger pans
- Long-press: Object-dependent — context menu for shapes, edit mode for text/notes

### Offline Behavior
- Connection loss: Warning banner but allow continued editing
- Cold start offline: Show cached boards (last-viewed boards available)
- Cache size: Last 10 boards
- Reconnection: Auto-dismiss banner ("Reconnected!" fades after 2-3s)

### Platform Permissions
- Camera: Yes — capture photos directly to canvas
- Push notifications: Both collaborator activity AND TODO due date reminders
- File exports: Both Photos app and Files app — user chooses destination per export

### Claude's Discretion
- Pinch-to-zoom sensitivity (reasonable defaults)
- Permission prompt timing (standard mobile UX pattern)
- Splash animation specifics

</decisions>

<specifics>
## Specific Ideas

- Stylus should feel premium — pressure sensitivity makes drawing natural
- Offline mode should be seamless — users shouldn't feel punished for bad connectivity
- Export flexibility matters — sometimes you want quick photo roll save, sometimes proper file organization

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-mobile-platform*
*Context gathered: 2026-01-23*
