# Orchestration Plan: CafeChi Platform Visual Perfection & Multi-Theme System

## Objective
Deliver a flawless, production-ready, 5-theme visual design system and comprehensive UI/UX responsiveness across all CafeChi pages, with 100% TypeScript compilation clean pass and dual-repo git synchronization.

## Phase 0: Codebase Survey (3 Parallel Explorers)
- **Explorer 1 (Theme System & Customer Menu)**:
  - Focus: 5 Themes (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`). Check tokens, theme provider, background tones, surface elevations, borders, radiuses, typography, Customer menu (`/c/[cafeSlug]`), "همان همیشگی" widget, loyalty stamps, cards, drawer, floating cart, table service hub.
- **Explorer 2 (All Other Pages & Responsive Polish)**:
  - Focus: Discovery Marketplace (`/`), KDS Barista Station (`/kds/[cafeSlug]`), Owner Studio (`/owner`), Super Admin (`/admin`), Auth (`/login`, `/register`), Mock Payment (`/mock-payment`). Check mobile/tablet/desktop responsiveness, RTL layout consistency, typography, interactive states.
- **Explorer 3 (Build, Type Checking, E2E & Git Multi-Repo)**:
  - Focus: TypeScript configuration, build scripts (`npx tsc --noEmit`), package scripts, test infrastructure, git remotes and branches for `RMNO21/cafechi-platform` and `RMNO21/cafechi-platform-24d8b`.

## Phase 1: Global Decomposition & PROJECT.md
- Merge survey findings into `PROJECT.md` with:
  - Feature Inventory (every required item mapped to a milestone).
  - Architecture and Code Layout boundaries.
  - Concrete Interface Contracts.
  - Milestones with dependencies.

## Phase 2: Dual Track Execution
- **Implementation Track**: Sub-orchestrators for milestones (theme engine, page polish, customer menu fidelity).
- **E2E & Verification Track**: Test infrastructure, opaque-box and visual verification, TypeScript compilation checks.

## Phase 3: Forensic Auditing & Multi-Repo Sync
- Independent Reviewers, Challengers, and Forensic Auditor verification.
- Git multi-remote synchronization to both repositories.

## Phase 4: Final Gate & Completion Reporting
- Final validation, human report to user.
