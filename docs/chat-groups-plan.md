# Chat Group Implementation Plan

_Last updated: 2025-12-06_

## 1. Scope & Goals
- Provide a consistent labeling system ("groups") that users can assign to chats in both `/chat` (admin) and `/user` (client) surfaces.
- Ensure all CRUD operations for groups persist to the shared database, scoped by `gtc_user_id`.
- Deliver a unified UX: accordion-based chat lists, shared `GroupPicker` modal, and color-coded labels.
- Maintain parity between frontends: changes in one surface must appear in the other after sync.

## 2. Current Architecture Overview
- **Backend (`chat_api.php`)** exposes:
  - `mode=chat_groups` – returns all groups for a `gtc_user_id`.
  - `mode=assign_chat_groups` – upserts groups and links them to `chat_id`.
  - Helper functions `normalize_group_spec_list`, `upsert_chat_group_for_user`, `chat_group_links` table ensure many-to-many mapping.
- **Shared service (`shared/chat-service.js`)** handles API calls, normalization, and log syncing. It also exports `GroupPicker` shared component.
- **Frontends**:
  - `/user/index.html` already renders grouped accordion lists and uses `GroupPicker` for assignment.
  - `/chat/index.html` still mixes legacy prompts with partial picker integration and lacks persistent syncing.

## 3. Requirements Breakdown
1. **Assignment**
   - User selects a chat, opens the picker, toggles 0–N groups.
   - Selection persists via `assign_chat_groups` and updates both UI states.
2. **Accordion Display**
   - Left sidebar lists groups first, each collapsible.
   - Chats appear under every group they belong to; unassigned chats fall into `Ungrouped`.
3. **Group CRUD**
   - Create (name + color) from picker.
   - Rename & delete (stretch goal; deletion removes links and optionally the group record).
4. **Data Model**
   - `chat_groups`: `{ group_id, gtc_user_id, name, color, timestamps }`.
   - `chat_group_links`: `{ chat_id, group_id, gtc_user_id }`.
   - All queries filter by `gtc_user_id`.
5. **Sync & Telemetry**
   - `/shared/chat-service.js` centralizes all calls.
   - UIs refresh group catalogs after every mutating operation.

## 4. Work Plan & Status
| Step | Description | Owner | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Confirm backend modes and adjust service to legacy-compatible names | Copilot | ✅ Done | `chat_groups`/`assign_chat_groups` now used across shared services |
| 2 | Instrument detailed logging around group API calls | Copilot | ✅ Done | Added mode alias logging and payload key tracing in `chat_api.php` |
| 3 | Fix persistence bug (HTTP 400) and verify /user saves succeed | Copilot | 🚧 In Progress | Added mode inference and friendlier 400 for unknown modes; need end-to-end retest on real backend |
| 4 | Finish `/chat` picker integration & sync logic | Copilot | ⏳ Pending | Replace prompt, hook up catalog/selection |
| 5 | Ensure color metadata persists end-to-end | Copilot | ⏳ Pending | Display colors in both UIs |
| 6 | Document & wire rename/delete flows (optional) | Copilot | ⏳ Pending | Depends on UX priority |
| 7 | Regression tests across `/chat` and `/user` | Copilot | ⏳ Pending | Manual + scripted |

Status legend: ✅ Done, ⏳ Pending, 🚧 In Progress, ❌ Blocked.

## 5. Test Matrix (to run per release)
1. **Assign existing group** in `/user`, confirm `/chat` shows it after refresh.
2. **Create new group** via picker (`Add & select`) and ensure it appears in both surfaces with color.
3. **Remove group** from chat: verify `Ungrouped` section updates.
4. **Multi-group chat**: assign 2+ groups, confirm duplication in accordion lists.
5. **Cross-session**: log out/in, ensure groups persist.
6. **Error handling**: simulate network failure; UI should rollback and message the user.

## 6. Next Actions
1. Reproduce current HTTP 400 on `assign_chat_groups`, capture payloads (local dev server still routes unknown modes to `handle_log_mode`, returning the legacy "message, session_id..." error).
2. Align backend/service modes & payload normalization.
3. Validate `/user` group saving end-to-end; update Step 3 to ✅ once user confirms.
4. Port picker experience fully into `/chat` and retest scenarios from Section 5.

### Observed Risks / Blockers
- **Prod backend missing group modes**: `curl` requests against `https://app.gtstor.com/chat_api.php` with `mode="assign_chat_groups"` or `mode="list_chat_groups"` still return the legacy error (`message, session_id, and client are required`). Until the server deploy includes the new handlers (`handle_list_chat_groups`, `handle_set_chat_groups`), UI calls will continue to fail. Work will proceed assuming the updated backend will be deployed alongside these changes.

### Design constraint
- Groups are scoped per `gtc_user_id`. The same `gtc_user_id` must see the same chats, groups, and assignments across `/chat` and `/user`, and admin filtering by `gtc_user_id` reuses this exact model.

_This document will be updated as each step is completed and confirmed._
