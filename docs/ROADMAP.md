# Collaborative TODO App - Project Roadmap

## Overview

This document outlines planned improvements organized into milestones for making the TODO app production-ready.

---

## Milestone 1: Critical Security (Priority: HIGH)

### Issue #1: Persistent SECRET_KEY
**Labels:** `security`, `quick-win`
**Complexity:** Low | **Impact:** High

Currently `SECRET_KEY` regenerates on restart, invalidating all sessions.

**Tasks:**
- [ ] Create `.env.example` with `SECRET_KEY` placeholder
- [ ] Update `config.py` to load from environment variable
- [ ] Add `python-dotenv` to requirements.txt
- [ ] Document in README

---

### Issue #2: Rate Limiting on Auth Endpoints
**Labels:** `security`, `enhancement`
**Complexity:** Low | **Impact:** High

Prevent brute-force attacks on `/auth/login` and `/auth/register`.

**Tasks:**
- [ ] Add `slowapi` to requirements.txt
- [ ] Configure rate limiter (5 attempts/minute per IP)
- [ ] Apply to auth endpoints
- [ ] Return 429 with retry-after header

---

### Issue #3: Password Strength Validation
**Labels:** `security`, `quick-win`
**Complexity:** Low | **Impact:** High

Currently accepts any password. Need minimum requirements.

**Tasks:**
- [ ] Add Pydantic validator to `UserCreate` schema
- [ ] Require: 8+ chars, uppercase, lowercase, number
- [ ] Return clear error messages
- [ ] Update registration form with requirements

---

### Issue #4: Secure Cookie Authentication
**Labels:** `security`, `enhancement`
**Complexity:** Medium | **Impact:** High

Replace localStorage JWT with HttpOnly cookies to prevent XSS token theft.

**Tasks:**
- [ ] Create cookie-based auth middleware
- [ ] Set HttpOnly, Secure, SameSite=Strict flags
- [ ] Update frontend to work without localStorage tokens
- [ ] Add CSRF protection for cookie-based auth

---

## Milestone 2: Production Infrastructure

### Issue #5: Docker Configuration
**Labels:** `devops`, `enhancement`
**Complexity:** Low | **Impact:** High

Enable consistent deployment across environments.

**Tasks:**
- [ ] Create `Dockerfile` with Python 3.11+ base
- [ ] Create `docker-compose.yml` with app + optional PostgreSQL
- [ ] Add health check to container
- [ ] Document usage in README

---

### Issue #6: Database Migrations with Alembic
**Labels:** `devops`, `enhancement`
**Complexity:** Medium | **Impact:** High

Current `create_all` doesn't handle schema changes gracefully.

**Tasks:**
- [ ] Add `alembic` to requirements.txt
- [ ] Initialize alembic configuration
- [ ] Create initial migration from current models
- [ ] Document migration workflow

---

### Issue #7: Environment-Based Configuration
**Labels:** `devops`, `quick-win`
**Complexity:** Low | **Impact:** High

Replace hardcoded values with environment variables.

**Tasks:**
- [ ] Update `config.py` to use Pydantic Settings
- [ ] Create `.env.example` with all variables
- [ ] Add database URL configuration
- [ ] Add JWT expiration configuration

---

### Issue #8: Structured Logging
**Labels:** `devops`, `enhancement`
**Complexity:** Medium | **Impact:** High

Replace print statements with proper logging.

**Tasks:**
- [ ] Add `structlog` or `loguru` to requirements
- [ ] Configure JSON output for production
- [ ] Add request ID to all log entries
- [ ] Log auth events, errors, and performance

---

## Milestone 3: Core Feature Enhancements

### Issue #9: Task Priorities
**Labels:** `feature`, `enhancement`
**Complexity:** Low | **Impact:** High

Allow users to set task priority levels.

**Tasks:**
- [ ] Add `priority` field to TodoItem model (1-4 scale)
- [ ] Update schemas and API
- [ ] Add priority selector to UI
- [ ] Add color-coded priority badges
- [ ] Allow filtering/sorting by priority

---

### Issue #10: Labels/Tags System
**Labels:** `feature`, `enhancement`
**Complexity:** Medium | **Impact:** High

Enable task categorization with tags.

**Tasks:**
- [ ] Create `Tag` and `TodoTag` models (many-to-many)
- [ ] Add CRUD endpoints for tags
- [ ] Update todo endpoints to include tags
- [ ] Add tag management UI
- [ ] Add filter by tag functionality

---

### Issue #11: Full-Text Search
**Labels:** `feature`, `enhancement`
**Complexity:** Medium | **Impact:** High

Search across todos by title and description.

**Tasks:**
- [ ] Add search endpoint `/lists/{id}/todos/search`
- [ ] Implement SQLite FTS5 or basic LIKE search
- [ ] Add search box to UI
- [ ] Highlight matching terms in results

---

### Issue #12: Due Date Reminders
**Labels:** `feature`, `enhancement`
**Complexity:** Medium | **Impact:** High

Notify users of upcoming due dates.

**Tasks:**
- [ ] Create background task to check due dates
- [ ] Send WebSocket notifications for items due in 24h
- [ ] Add visual indicator for overdue items
- [ ] Add "due today" filter option

---

## Milestone 4: UX Improvements

### Issue #13: Keyboard Shortcuts
**Labels:** `enhancement`, `ux`, `quick-win`
**Complexity:** Low | **Impact:** High

Improve power user experience.

**Shortcuts:**
- `n` - New task
- `d` - Mark done
- `e` - Edit selected
- `Esc` - Close modal
- `/` - Focus search

**Tasks:**
- [ ] Add keyboard event listeners
- [ ] Show shortcuts in help tooltip
- [ ] Add visual feedback on shortcut use

---

### Issue #14: Drag-and-Drop Reordering
**Labels:** `enhancement`, `ux`
**Complexity:** Medium | **Impact:** High

Allow reordering tasks via drag-and-drop.

**Tasks:**
- [ ] Add `position` field to TodoItem model
- [ ] Create reorder endpoint
- [ ] Integrate SortableJS or HTML5 drag API
- [ ] Persist order changes

---

### Issue #15: Mobile Responsiveness
**Labels:** `enhancement`, `ux`
**Complexity:** Medium | **Impact:** High

Improve mobile experience.

**Tasks:**
- [ ] Add responsive breakpoints to CSS
- [ ] Make sidebar collapsible on mobile
- [ ] Increase touch target sizes
- [ ] Test on various screen sizes

---

### Issue #16: Dark Mode
**Labels:** `enhancement`, `ux`, `quick-win`
**Complexity:** Low | **Impact:** Medium

Add dark theme option.

**Tasks:**
- [ ] Define CSS variables for colors
- [ ] Create dark theme values
- [ ] Add toggle in navbar
- [ ] Persist preference in localStorage

---

### Issue #17: Toast Notifications
**Labels:** `enhancement`, `ux`, `quick-win`
**Complexity:** Low | **Impact:** Medium

Replace `alert()` with non-blocking toasts.

**Tasks:**
- [ ] Create toast notification component
- [ ] Style for success, error, info variants
- [ ] Auto-dismiss after 3 seconds
- [ ] Replace all alert() calls

---

## Milestone 5: Code Quality

### Issue #18: API Versioning
**Labels:** `maintenance`, `quick-win`
**Complexity:** Low | **Impact:** High

Enable backwards-compatible API evolution.

**Tasks:**
- [ ] Create `/api/v1/` router prefix
- [ ] Move all endpoints under versioned prefix
- [ ] Update frontend API calls
- [ ] Document versioning strategy

---

### Issue #19: Comprehensive Type Hints
**Labels:** `maintenance`, `code-quality`
**Complexity:** Low | **Impact:** Medium

Add type hints throughout codebase.

**Tasks:**
- [ ] Add return types to all functions
- [ ] Add parameter types where missing
- [ ] Run mypy for type checking
- [ ] Add mypy to CI pipeline

---

### Issue #20: Error Handling Middleware
**Labels:** `maintenance`, `enhancement`
**Complexity:** Low | **Impact:** Medium

Consistent error response format.

**Tasks:**
- [ ] Create global exception handler
- [ ] Define standard error response schema
- [ ] Handle validation errors consistently
- [ ] Add error codes for client handling

---

## Quick Wins (< 1 hour each)

| Issue | Description |
|-------|-------------|
| #1 | Persistent SECRET_KEY |
| #3 | Password strength validation |
| #7 | Environment configuration |
| #13 | Keyboard shortcuts |
| #16 | Dark mode |
| #17 | Toast notifications |
| #18 | API versioning |

---

## GitHub Issue Commands

Create these issues using GitHub CLI:

```bash
# Milestone 1: Security
gh issue create --title "Persistent SECRET_KEY" --label "security,quick-win" --body "See ROADMAP.md Issue #1"
gh issue create --title "Rate Limiting on Auth Endpoints" --label "security,enhancement" --body "See ROADMAP.md Issue #2"
gh issue create --title "Password Strength Validation" --label "security,quick-win" --body "See ROADMAP.md Issue #3"
gh issue create --title "Secure Cookie Authentication" --label "security,enhancement" --body "See ROADMAP.md Issue #4"

# Milestone 2: Infrastructure
gh issue create --title "Docker Configuration" --label "devops,enhancement" --body "See ROADMAP.md Issue #5"
gh issue create --title "Database Migrations with Alembic" --label "devops,enhancement" --body "See ROADMAP.md Issue #6"
gh issue create --title "Environment-Based Configuration" --label "devops,quick-win" --body "See ROADMAP.md Issue #7"
gh issue create --title "Structured Logging" --label "devops,enhancement" --body "See ROADMAP.md Issue #8"

# Milestone 3: Features
gh issue create --title "Task Priorities" --label "feature,enhancement" --body "See ROADMAP.md Issue #9"
gh issue create --title "Labels/Tags System" --label "feature,enhancement" --body "See ROADMAP.md Issue #10"
gh issue create --title "Full-Text Search" --label "feature,enhancement" --body "See ROADMAP.md Issue #11"
gh issue create --title "Due Date Reminders" --label "feature,enhancement" --body "See ROADMAP.md Issue #12"

# Milestone 4: UX
gh issue create --title "Keyboard Shortcuts" --label "enhancement,ux,quick-win" --body "See ROADMAP.md Issue #13"
gh issue create --title "Drag-and-Drop Reordering" --label "enhancement,ux" --body "See ROADMAP.md Issue #14"
gh issue create --title "Mobile Responsiveness" --label "enhancement,ux" --body "See ROADMAP.md Issue #15"
gh issue create --title "Dark Mode" --label "enhancement,ux,quick-win" --body "See ROADMAP.md Issue #16"
gh issue create --title "Toast Notifications" --label "enhancement,ux,quick-win" --body "See ROADMAP.md Issue #17"

# Milestone 5: Code Quality
gh issue create --title "API Versioning" --label "maintenance,quick-win" --body "See ROADMAP.md Issue #18"
gh issue create --title "Comprehensive Type Hints" --label "maintenance,code-quality" --body "See ROADMAP.md Issue #19"
gh issue create --title "Error Handling Middleware" --label "maintenance,enhancement" --body "See ROADMAP.md Issue #20"
```
