# 🤖 `.github/workflows/` — Complete Workflow Reference

This directory contains **41 GitHub Actions workflows** across 11 categories.
All workflows use `actions/github-script@v7` and `GITHUB_TOKEN` unless noted otherwise.

---

## 📂 Category Index

| # | Category | Count |
|---|----------|-------|
| 1 | [Assignment & Issue Management](#1--assignment--issue-management) | 5 |
| 2 | [PR Validation & Review Pipeline](#2--pr-validation--review-pipeline) | 9 |
| 3 | [Spam & Quality Detection](#3--spam--quality-detection) | 4 |
| 4 | [Mentor System](#4--mentor-system) | 7 |
| 5 | [Leaderboard & Contributors](#5--leaderboard--contributors) | 3 |
| 6 | [Label Management](#6--label-management) | 3 |
| 7 | [Bots & Notifications](#7--bots--notifications) | 3 |
| 8 | [Code Quality & Linting](#8--code-quality--linting) | 1 |
| 9 | [Scheduled Data Refresh](#9--scheduled-data-refresh) | 3 |
| 10 | [AI Agent Review](#10--ai-agent-review) | 1 |
| 11 | [CI/CD Deployment](#11--cicd-deployment) | 2 |

---

## 1 — Assignment & Issue Management

| File | Trigger | Description |
|------|---------|-------------|
| `issue-context-assignment.yml` | `issue_comment` | Handles `/assign` commands — validates eligibility by difficulty, queues for mentor or auto-assigns |
| `unassign-issues.yml` | `schedule` (daily) | Unassigns contributors inactive for 7+ days; exempts maintainers |
| `assignment-timeout-escalation.yml` | `schedule` (6h) | Escalates pending assignments to PA after 24h of no mentor response |
| `mentor-assignment-expiry.yml` | `schedule` (6h) | Rotates unresponsive mentor in pending-assignments.json after 24h |
| `issue-validate.yml` | `issues` opened/edited | Validates issue has required sections; applies `valid-issue` or `needs-more-info` |

## 2 — PR Validation & Review Pipeline

| File | Trigger | Description |
|------|---------|-------------|
| `pr-validator.yml` | `pull_request_target` | Validates linked issue, description, checklist — applies `pr-valid` or `needs-pr-fixes` |
| `dco-helper.yml` | `pull_request_target` | Enforces DCO sign-off on all commits; posts fix instructions |
| `pr-stage-manage.yml` | `pull_request_target` labeled | Central 3-stage pipeline manager — posts status comments on transitions |
| `stage2-review-approval.yml` | `pull_request_review` | Handles `/approve-pr` and `/lgtm` from verified mentors |
| `pr-pa-gate.yml` | `pull_request_target` labeled | Stage 3 gate — posts pa-approval status comments |
| `pr-size-label.yml` | `pull_request_target` | Labels PRs XS/S/M/L/XL by lines changed |
| `dismiss-change-requests-on-commit.yml` | `pull_request_target` sync | Auto-dismisses stale CHANGES_REQUESTED reviews on new push |
| `stale-pr.yml` | `schedule` (daily) | Warns after 14d inactivity; closes after 21d. Respects `no-stale` |
| `request-review.yml` | `pull_request_target` labeled | Selects 2 random mentors for review when `stage-1-approved` is applied |

## 3 — Spam & Quality Detection

| File | Trigger | Description |
|------|---------|-------------|
| `detect-ai-slop.yml` | `pull_request_target` | LLM analysis of PR diffs for AI-generated content (requires `OPENAI_API_KEY`) |
| `duplicate-issue.yml` | `issues` opened | Keyword overlap detection against open issues; applies `possible-duplicate` |
| `duplicate-pr.yml` | `pull_request_target` opened | Detects PRs targeting the same issue; applies `duplicate-pr` |
| `detect-ping-spam.yml` | `issue_comment` | Warns at 2nd maintainer ping; applies `ping-spam` at 3rd+ |

## 4 — Mentor System

| File | Trigger | Description |
|------|---------|-------------|
| `mentor-label-auto-apply.yml` | Multiple | Auto-applies `mentor:USERNAME` when mentor reviews or is assigned |
| `mentor-label-fallback.yml` | PR closed / issue closed | Applies `mentor:Ayushh-Sharmaa` fallback if no mentor label at close |
| `mentor-review-tracker.yml` | `pull_request_review` | Records review events in `mentor-stats.json` |
| `mentor-review-quality.yml` | `pull_request_target` closed | Scores merged PR reviews by word count and state |
| `mentor-review-timeout.yml` | `schedule` (8h) | Rotates unresponsive reviewer(s) after 24h |
| `mentors-leaderboard.yml` | `pull_request_target` closed | Regenerates mentor leaderboard comment on a pinned issue |
| `update-mentor-leaderboard.yml` | `schedule` (daily) | Triggers `mentors-leaderboard.yml` to keep rankings current |

## 5 — Leaderboard & Contributors

| File | Trigger | Description |
|------|---------|-------------|
| `leaderboard.yml` | `pull_request_target` closed | Updates contributor leaderboard with merged PR counts |
| `add-contributor.yml` | `workflow_dispatch` | Adds contributor avatar to README.md between markers |
| `program-classification-validator.yml` | `pull_request_target` | Validates PR program (GSSoC/NSoC/General) matches label |

## 6 — Label Management

| File | Trigger | Description |
|------|---------|-------------|
| `label-sync.yml` | Push to `main` (.github/labels/) | Syncs `gssoc-labels.json` definitions to repo labels |
| `issue-label-enforce.yml` | `issues` events | Enforces `level:*` and `type:*` labels; applies `needs-labels` if missing |
| `priority-label-manager.yml` | `issues` / `pull_request_target` | Auto-assigns `priority:high/medium/low` by keyword matching |

## 7 — Bots & Notifications

| File | Trigger | Description |
|------|---------|-------------|
| `welcome-issue-bot.yml` | `issues` opened | Welcomes first-time issue authors |
| `pr-welcome-bot.yml` | `pull_request_target` opened | Explains the 3-stage pipeline to first-time PR authors |
| `remind-unresolved-conversations.yml` | `schedule` (daily) | Pings PR authors with unresolved review threads after 48h |

## 8 — Code Quality & Linting

| File | Trigger | Description |
|------|---------|-------------|
| `code-quality.yml` | `push` / `pull_request` | ESLint + TypeScript type check (frontend) + Ruff (Python backend) |

## 9 — Scheduled Data Refresh

| File | Trigger | Description |
|------|---------|-------------|
| `refresh-good-first-issues.yml` | `schedule` (weekly Mon) | Runs `agent/scripts/fetch-issues.js` to refresh issue data |
| `project-management.yml` | `issues` / `pull_request_target` | Adds items to GitHub Projects v2 board (requires `PROJECTS_TOKEN`) |
| `spam-escalation.yml` | `issues` / `pull_request_target` labeled | On `spam` label: removes assignment, pings PA |

## 10 — AI Agent Review

| File | Trigger | Description |
|------|---------|-------------|
| `tenet-pr-review.yml` | `pull_request` | Runs `agent/tenet_agent/tenet_review.py` AI reviewer (requires `OPENAI_API_KEY`) |

## 11 — CI/CD Deployment

These were created as part of repo restoration and are not in the original 39-workflow index.

| File | Trigger | Description |
|------|---------|-------------|
| `code-quality.yml` | `push` + PR | Full lint + type-check CI (see Cat. 8) |

---

## 📁 Supporting Data Files

| File | Used by |
|------|---------|
| `.github/reviewers/gssoc-mentors.json` | `request-review.yml`, `mentor-assignment-expiry.yml`, `stage2-review-approval.yml`, `mentor-review-timeout.yml` |
| `.github/reviewers/mentor-stats.json` | `mentor-review-tracker.yml`, `mentor-review-quality.yml`, `mentors-leaderboard.yml` |
| `.github/reviewers/pending-assignments.json` | `mentor-assignment-expiry.yml` |
| `.github/labels/gssoc-labels.json` | `label-sync.yml` |

---

## 🔐 Required Secrets & Variables

| Key | Type | Used by |
|-----|------|---------|
| `GITHUB_TOKEN` | Auto | All workflows |
| `OPENAI_API_KEY` | Secret | `detect-ai-slop.yml`, `tenet-pr-review.yml` |
| `PROJECTS_TOKEN` | Secret | `project-management.yml` |
| `MENTOR_LEADERBOARD_ISSUE` | Repo Variable | `mentors-leaderboard.yml` |
| `CONTRIBUTOR_LEADERBOARD_ISSUE` | Repo Variable | `leaderboard.yml` |
| `PROJECT_BOARD_NUMBER` | Repo Variable | `project-management.yml` |
