# Feature Landscape: Collaborative TODO/Whiteboard App

**Domain:** Visual collaboration with task management integration
**Researched:** 2026-01-19
**Confidence:** HIGH (based on official documentation from Figma, Miro, G2 reviews, and multiple authoritative sources)

---

## Table Stakes

Features users expect from any collaborative whiteboard/TODO tool. Missing these = product feels incomplete or users leave immediately.

### Core Canvas Features

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Infinite/unlimited canvas** | Physical whiteboards have limits; digital should not. Zapier testing criteria explicitly requires this. | Medium | Requires virtual viewport with pan/zoom. Performance critical at scale. Include minimap for orientation (Goodnotes approach). |
| **Pan and zoom** | Essential navigation. Every whiteboard app has this. Standard gestures. | Medium | Two-finger pinch, scroll wheel, keyboard shortcuts (Ctrl+scroll). Built into tldraw. |
| **Undo/Redo** | Universal expectation (Ctrl+Z, Ctrl+Y). Users will rage-quit without it. | Medium | Must work per-user in collaborative mode. Yjs provides CRDT-based undo. tldraw handles it. |
| **Selection tool** | Select, move, resize, delete objects. Basic manipulation. | Low | Multi-select with Shift+click or drag box. Built into tldraw. |
| **Basic shapes** | Rectangle, circle, line, arrow at minimum. | Low | Built into tldraw/Konva. Sticky notes and connectors higher priority than shape variety. |

### Drawing Tools

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Freehand pen/marker** | Core whiteboard interaction. Drawing is why people use whiteboards. FigJam has marker, highlighter, washi tape. | Medium | tldraw includes perfect-freehand. Stroke smoothing critical for quality. |
| **Eraser** | Necessary complement to drawing. | Low | Stroke-based (delete whole stroke) simpler and more common than pixel-based. |
| **Color picker** | Users expect at least 8-12 colors for pen/shapes. Excalidraw rated 9.7 on G2 for color options. | Low | Preset palette faster than full color picker. Built into tldraw. |
| **Stroke width options** | At least 3 sizes (thin, medium, thick). | Low | Essential for hierarchy in drawings. |

### Sticky Notes / Text

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Sticky notes** | Cornerstone of visual collaboration. FigJam calls them "stickies" - core for any FigJam board. Miro, Excalidraw, all competitors have them. | Medium | Multiple colors, resize, editable text. Double-click to edit. tldraw has built-in sticky note shape. |
| **Text objects** | Sometimes users need standalone text, not in sticky. FigJam has point text and area text. | Low | Basic formatting (bold, italic) nice but not required for MVP. tldraw has excellent text handling. |
| **Text editing in place** | Click to edit, not modal dialog. | Low | Inline editing is table stakes UX. tldraw handles this well. |

### Real-Time Collaboration

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Live cursors** | Shows where others are on canvas. Canva: "real-time, colorful cursors let you know what team members are doing." Expected from Figma, Miro, Google Docs. | Medium | Colored cursor with username label. Yjs awareness protocol. Broadcast position via WebSocket. |
| **Presence indicators** | See who's online/viewing the board. | Medium | Avatar list in corner, colored borders, join/leave notifications. Yjs awareness. |
| **Real-time sync** | Changes appear instantly for all viewers. Latency under 200ms expected (Google Docs standard). | High | Yjs + pycrdt-websocket. Requires WebSocket infrastructure, CRDT conflict resolution. |
| **Shareable link** | Copy link, send to colleague, they can view/edit. FigJam allows guest access for 24 hours without login. | Low | Generate unique board URLs. Authentication optional for viewers. |

### Export & Sharing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Export to PNG/JPG** | Basic sharing with non-users. Excalidraw, Microsoft Whiteboard, Zoom all offer this. | Low | Canvas toDataURL or html2canvas. |
| **Export to PDF** | Documentation, printing, formal sharing. ClickUp recently added this as highly requested feature. | Medium | May need server-side rendering for large boards. Ziteboard uses A4 page structure. |
| **Copy/paste images** | Paste screenshots, drag images from desktop. FigJam supports PNG, JPEG, HEIC, GIF, TIFF, WEBP. | Medium | File upload + clipboard API. Requires MinIO backend. |

### Access & Permissions

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **View-only sharing** | Share without allowing edits. Microsoft Whiteboard: "assign either editing or read-only permissions." | Low | Permission flag on share link. |
| **Board ownership** | Creator can delete, manage access. | Low | Basic user association. Owner can remove others but others can't remove owner. |

---

## Differentiators

Features that set the product apart. Not expected, but create competitive advantage or delight.

### TODO Integration (Your Core Value Proposition)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **TODO cards as first-class objects** | Unlike generic stickies, these have status, due dates, assignees. Your unique angle vs pure whiteboards. | Medium | Custom tldraw shape. Bridge CRDT state with SQLAlchemy models. |
| **Task status on canvas** | Visual representation of done/not done (checkmarks, color coding). | Low | Powerful visual management. Kanban-style columns optional. |
| **Drag task to column** | Kanban workflow directly on whiteboard. Miro syncs with Jira, Asana, Azure. | Medium | Status changes via spatial position. |
| **Task grouping/sections** | Group related tasks visually with frames or areas. | Medium | Like FigJam sections that "cluster and contain multiple objects." |

### Collaboration Enhancements

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Comments/threads** | Async collaboration on specific objects. FigJam has @ mentions. | High | Requires additional data model. Defer to Phase 4 or later. |
| **Voting/reactions** | Quick consensus on ideas. FigJam has stamps ("curated stickers") and emotes (temporary emoji reactions). | Medium | Great for workshops and brainstorming sessions. |
| **Follow/spotlight mode** | See what presenter is looking at. FigJam has "Spotlight feature for presenter control." | Medium | Useful for guided walkthroughs. |
| **Audio/video call integration** | Built-in voice chat while collaborating. FigJam has audio calling. | High | Consider third-party integration (Daily, Livekit) instead of building. |
| **Guest access (no login)** | Reduce friction for external collaborators. FigJam: "contribute to files free for 24 hours without login." | Low | Time-limited or view-only for guests. Major friction reducer. |

### Canvas Intelligence

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Auto-layout/tidy up** | Arrange scattered objects into neat grid. FigJam: "Tidy up feature to arrange objects into uniform grid of rows and columns." | Medium | Delight feature. Reduces manual cleanup. |
| **Snap-to-grid** | Objects align when moved near others. | Low | Improves aesthetics effortlessly. Built into tldraw. |
| **Smart connectors** | Lines that stay attached when objects move. Excalidraw added "elbow arrows" for flowcharts. | High | Complex but valuable for diagrams. |
| **Templates** | Pre-made boards for common activities. FigJam has "300+ pre-made templates." | Low | JSON presets for canvas state. High value, low engineering. |
| **Shape libraries** | Excalidraw has extensive community libraries at libraries.excalidraw.com. Icons, flowchart shapes, etc. | Medium | MIT licensed libraries available. Can start with basics. |

### Offline & Sync

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Offline editing** | Work without internet, sync when reconnected. Most competitors DON'T have this (MS Whiteboard has limited offline). | Very High | Yjs + IndexedDB persistence. Major differentiator if done well. |
| **Conflict resolution UI** | When sync conflicts occur, show user-friendly resolution. | High | Last-write-wins acceptable for MVP. Explicit UI is rare but valuable. |
| **Version history** | Revert to previous states. See past states of canvas. | Medium | Yjs snapshots support this. Storage implications. |

### Power User Features

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Keyboard shortcuts** | Power users expect Ctrl+D (duplicate), Delete, arrow keys. Microsoft Whiteboard has comprehensive shortcuts. | Low | High ROI for productivity. Ctrl+Z, Ctrl+Y, Ctrl+A standard. |
| **Layers** | Organize complex boards. Zoom Whiteboard has layer management. | Medium | Not essential for MVP but scales well. |
| **Embed in web page** | iframe embed for documentation sites, wikis. WebBoard offers embed code generation. | Low | Generate embed code with domain whitelist. |

---

## Anti-Features

Features to deliberately NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Feature bloat / kitchen sink** | Miro has 2000+ shapes, AI features, docs, slides. Meahana research: "session leaders lose average of 10 minutes just acclimating users to platform." Complexity causes overwhelming UX. | Start minimal like Excalidraw. Add features only when validated by user demand. |
| **Complex permission hierarchies** | Enterprise features (roles, SSO, audit logs) before product-market fit. Engineering cost without clear ROI. | Simple view/edit permissions at room level. Add enterprise when enterprise customers pay. |
| **Deep nesting / folders** | Complex organization systems for boards. Users lose content, navigation becomes problem itself. | Flat structure with search. Maybe simple folders later. |
| **Heavy AI features early** | AI summarization, text-to-diagram, auto-brainstorm. Miro pushing this hard in 2025 but expensive and distracting from core value. | Focus on core collaboration. AI enhancement later, not foundation. |
| **Full document editing** | Rich text with headers, tables, code blocks. Scope creep into Notion territory. | Sticky notes and simple text. Embed links to Google Docs/Notion. |
| **Complex diagramming (UML, ERD)** | Full technical diagrams with strict semantics. Needs specialized UI. | Simple shapes and connectors. Users who need Lucidchart will use Lucidchart. |
| **Pixel-perfect design tools** | Rulers, precise measurements, design-grade tools. | Hand-drawn aesthetic (Excalidraw style) easier to build and removes "I can't draw" anxiety. |
| **Custom rendering engine** | Years of work. Complex canvas math. | Use tldraw or Konva. Battle-tested libraries. |
| **Real-time video/voice built-in** | Scope creep, different expertise entirely. | Integrate existing tools (Loom, Meet, Daily.co) via links or embeds. |
| **Local-first without server** | Makes auth/permissions very hard. | Keep server as source of truth, use CRDTs for sync layer. |
| **Mobile-specific gestures** | Maintenance burden, platform fragmentation. | Stick with web-standard touch events. |
| **Per-element permissions** | "User A can edit sticky 1 but not sticky 2." Massive complexity. | Keep permissions at board level only. |

---

## Real-Time Collaboration Expectations

What users specifically expect from the "real-time" aspect based on Tiptap, Supabase, and whiteboard vendor documentation.

### Presence & Awareness

| Expectation | Implementation | Priority |
|-------------|----------------|----------|
| **Colored live cursors** | Each user gets unique color. Cursor shows on all other screens with ~50-100ms latency. Tiptap: "helps users anticipate what others are about to do." | CRITICAL |
| **Username labels on cursors** | Small tag showing who owns each cursor. Conceptboard: "own colored pointer and name tag." | CRITICAL |
| **Who's online indicator** | Avatar strip or list showing active collaborators. | HIGH |
| **Join/leave notifications** | Toast or subtle indicator when someone joins/leaves. Supabase Presence API supports this. | MEDIUM |
| **Activity indicators** | Show when someone is editing an object (pulsing border, typing indicator). | MEDIUM |

### Sync Behavior

| Expectation | Implementation | Priority |
|-------------|----------------|----------|
| **Instant updates** | Changes visible to others within 200ms. Google Docs set this expectation. | CRITICAL |
| **No data loss** | Network hiccups shouldn't lose work. Local persistence + retry. | CRITICAL |
| **Concurrent editing safety** | Two people editing same sticky note shouldn't corrupt it. CRDT handles this. | HIGH |
| **Reconnection handling** | If connection drops, reconnect seamlessly and sync missed changes. Nextcloud bug shows this matters. | HIGH |
| **Offline indicator** | Show user when they're disconnected. | HIGH |

### Conflict Resolution

| Expectation | Typical Solution | Notes |
|-------------|------------------|-------|
| **Position conflicts** | Last-write-wins. Object ends up where last mover put it. | Acceptable. Users rarely drag same object simultaneously. |
| **Text conflicts** | Character-level merging via CRDT (Yjs). | CRDT provides smooth experience. Research Figma's per-property LWW approach. |
| **Delete conflicts** | If one user deletes while another edits, delete wins. | Design decision. Document behavior. |
| **Undo in multiplayer** | User's undo only affects their own actions, not others'. | Complex but important. tldraw + Yjs handles this. |

### Scale Considerations

| Scenario | Expectation | Notes |
|----------|-------------|-------|
| **2-5 users** | Flawless real-time. This is the common case. | Optimize for this. |
| **10-20 users** | Should work but may show some latency. | Acceptable degradation. |
| **50+ users** | May not show all cursors, updates may batch. FigJam caps here. | Document this limit. Supabase mentions "up to 50 participants" for real-time cursors. |

---

## Feature Dependencies

Understanding what needs to be built first.

```
Canvas System (foundation) - tldraw
    |
    +-- Pan/Zoom (built-in)
    |
    +-- Selection Tool (built-in)
    |       |
    |       +-- Move/Resize
    |       +-- Multi-select
    |       +-- Delete
    |
    +-- Object System
            |
            +-- Shapes (rectangle, circle, arrow) - built-in
            +-- Sticky Notes - built-in
            |       |
            |       +-- Text Editing - built-in
            |       +-- Color Options - built-in
            |
            +-- Freehand Drawing - built-in (perfect-freehand)
            |       |
            |       +-- Eraser - built-in
            |       +-- Color/Stroke options - built-in
            |
            +-- TODO Cards (custom tldraw shape) - YOUR DIFFERENTIATOR
                    |
                    +-- Status integration with existing TODO system
                    +-- Due dates display
                    +-- Assignee display

Real-Time System (Yjs) - can build in parallel with canvas
    |
    +-- WebSocket connection (pycrdt-websocket)
    |
    +-- Presence (Yjs awareness protocol)
    |       |
    |       +-- Live cursors
    |       +-- Online user list
    |
    +-- Sync (object CRUD operations)
    |
    +-- Conflict Resolution (CRDT automatic)
    |
    +-- Offline persistence (IndexedDB)

File Storage (MinIO)
    |
    +---> Image upload
    |
    +---> Export to image/PDF
    |
    +---> Asset management
```

---

## MVP Recommendation

For MVP, prioritize:

### Must Have (Table Stakes)

1. **Infinite canvas with pan/zoom** - Foundation, tldraw built-in
2. **Sticky notes with colors** - Core collaboration primitive
3. **Basic shapes** - Rectangle, circle, line, arrow
4. **Selection, move, resize, delete** - tldraw built-in
5. **Freehand drawing + eraser** - Core whiteboard function
6. **Live cursors with usernames** - Shows collaboration is working
7. **Real-time sync** - 200ms latency target, Yjs
8. **Shareable link** - view/edit permissions
9. **Undo/redo** - Per-user, Yjs handles
10. **Export to PNG** - Basic sharing

### Should Have (Near-MVP)

1. **TODO cards with status** - YOUR DIFFERENTIATOR, custom tldraw shape
2. **Image upload** - Frequently requested, MinIO backend
3. **Presence indicator** - Who's online list
4. **Basic keyboard shortcuts** - Ctrl+Z, Ctrl+Y, Delete, etc.
5. **Text objects** - Standalone text, not just stickies

### Defer to Post-MVP

- **Comments/threads** - Adds complexity, async can wait (Phase 4+)
- **Voting/reactions** - Nice for workshops, not core
- **Templates** - Build once you understand user patterns (Phase 3)
- **Offline editing UI polish** - Yjs supports natively, needs UI work (Phase 3)
- **Version history** - Yjs snapshots, storage cost (Phase 3)
- **AI features** - Out of scope, expensive
- **Layers** - Power user feature
- **Smart connectors** - Complex geometry
- **Export to PDF** - Can use browser print initially (Phase 3)

---

## Feature-to-Tech Mapping

| Feature | Primary Technology |
|---------|-------------------|
| Freehand drawing | tldraw (includes perfect-freehand) |
| Basic shapes | tldraw built-in |
| Sticky notes | tldraw sticky note shape |
| Real-time sync | Yjs + pycrdt-websocket |
| Multi-user cursors | Yjs awareness protocol |
| Image upload | MinIO + FastAPI endpoints |
| Undo/redo | tldraw + Yjs |
| TODO cards | Custom tldraw shape |
| Offline editing | Yjs + IndexedDB persistence |
| Version history | Yjs snapshots |
| Export PNG | canvas.toDataURL or html2canvas |
| Export PDF | Server-side rendering or html2canvas |

---

## Sources

### Official Documentation (HIGH confidence)

- [FigJam Guide - Figma Help Center](https://help.figma.com/hc/en-us/articles/1500004362321-Guide-to-FigJam) - Verified feature list: stickies, shapes, connectors, marker, highlighter, washi tape, stamps, emotes, audio calling, sections, templates
- [Microsoft Whiteboard Keyboard Shortcuts](https://support.microsoft.com/en-us/office/whiteboard-keyboard-shortcuts-46a07ee8-7739-4dc5-a529-f5e1513b1745) - Verified shortcuts: Ctrl+Z, Ctrl+Y, Ctrl+A, pan with Ctrl+arrows
- [Confluence Whiteboard Export](https://support.atlassian.com/confluence-cloud/docs/export-or-import-your-whiteboard/) - Export options: entire board or selected area
- [ClickUp Whiteboard Permissions](https://help.clickup.com/hc/en-us/articles/7874277803415-Share-and-set-Whiteboard-permissions) - View only and edit permission levels
- [Tiptap Awareness Documentation](https://tiptap.dev/docs/collaboration/core-concepts/awareness) - Cursor positions, custom user states, CRDT-based awareness
- [Excalidraw Libraries](https://libraries.excalidraw.com/) - MIT-licensed shape libraries
- [tldraw Features](https://tldraw.dev/) - Built-in capabilities
- [Yjs Documentation](https://docs.yjs.dev) - Collaboration features

### Feature Comparisons (MEDIUM confidence)

- [Miro vs Excalidraw 2025 - Miro](https://miro.com/compare/miro-vs-excalidraw/)
- [Excalidraw vs FigJam - G2](https://www.g2.com/compare/excalidraw-vs-fig-jam) - Drawing capabilities: Excalidraw 9.4, FigJam 8.3; Collaboration: FigJam 9.5
- [Excalidraw vs FigJam vs Miro - SourceForge](https://sourceforge.net/software/compare/Excalidraw-vs-FigJam-vs-Miro/)
- [Best Miro Alternatives 2026](https://cpoclub.com/tools/best-miro-alternative/)
- [Miro 2025 Recap](https://miro.com/blog/2025-recap/) - AI Canvas, Flows, Sidekicks, Miro Tables

### Best Practices & Industry (MEDIUM confidence)

- [Zapier Best Online Whiteboards 2025](https://zapier.com/blog/best-online-whiteboard/) - Criteria: unlimited canvas, real-time collaboration, attach files, presentation options
- [Collaboard Security & Permissions](https://www.collaboard.app/en/blog/online-whiteboard-security-manage-access-and-permissions) - Viewer/Editor/Facilitator roles, SSO
- [Goodnotes Infinite Canvas Design](https://www.goodnotes.com/blog/building-whiteboard-infinite-canvas) - Minimap, zoom indicator, dot-grid for orientation

### Technical Implementation (HIGH confidence)

- [Building Real-Time Collaboration: OT vs CRDT - TinyMCE](https://www.tiny.cloud/blog/real-time-collaboration-ot-vs-crdt/) - OT needs central authority, CRDT allows peer-to-peer
- [CRDTs for Collaboration - DEV](https://dev.to/puritanic/building-collaborative-interfaces-operational-transforms-vs-crdts-2obo) - Figma uses server-authoritative LWW per property
- [Creating Infinite Whiteboard - Medium](https://medium.com/@tom.humph/creating-an-infinite-whiteboard-97527e886712) - Scale and redraw on touchmove, track x-offset, y-offset, scale
- [Top Whiteboard Libraries](https://byby.dev/js-whiteboard-libs) - Feature comparison

### Pain Points & User Feedback (MEDIUM confidence)

- [Meahana - The Whiteboard Conundrum](https://www.meahana.io/blog-posts/whiteboard-problem) - "session leaders lose average of 10 minutes acclimating users"
- [Why You Hate Your Online Whiteboard](https://mcsquares.com/blogs/m-c-squares-blog/why-you-hate-your-online-whiteboard-and-why-you-miss-your-old-one) - Buggy, crash-prone, learning curve issues
