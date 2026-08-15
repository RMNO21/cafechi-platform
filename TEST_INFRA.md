# E2E Test Infra: CafeChi Platform

## Test Philosophy
- Opaque-box, requirement-driven. No internal module hacks.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Interaction + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|--------|:------:|:------:|:------:|:------:|
| 1 | 5-Theme Definitions & Tokens | ORIGINAL_REQUEST §1 | 5 | 5 | ✓ | ✓ |
| 2 | Customer Menu Theme Injection | ORIGINAL_REQUEST §1 | 5 | 5 | ✓ | ✓ |
| 3 | Haman Hamishegi Widget | ORIGINAL_REQUEST §1 | 5 | 5 | ✓ | ✓ |
| 4 | Loyalty Stamp Card | ORIGINAL_REQUEST §1 | 5 | 5 | ✓ | ✓ |
| 5 | Coffee Flavor Radar Chart | Survey Findings | 5 | 5 | ✓ | ✓ |
| 6 | Menu Drawer & Floating Cart | ORIGINAL_REQUEST §1 | 5 | 5 | ✓ | ✓ |
| 7 | Table Service Hub & FAB | ORIGINAL_REQUEST §1 | 5 | 5 | ✓ | ✓ |
| 8 | KDS Barista Board & SSE | Survey Findings | 5 | 5 | ✓ | ✓ |
| 9 | Owner Studio & Category CRUD | ORIGINAL_REQUEST §2 | 5 | 5 | ✓ | ✓ |
| 10 | Super Admin Dashboard | ORIGINAL_REQUEST §2 | 5 | 5 | ✓ | ✓ |
| 11 | Discovery Marketplace | ORIGINAL_REQUEST §2 | 5 | 5 | ✓ | ✓ |
| 12 | Auth & Mock Payment Gateway | ORIGINAL_REQUEST §2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js / TypeScript test script (or Vitest test suite) that executes automated test suites against the build and components.
- Verification channels: Exit code 0 on all test tiers, zero assertions failed.

## Coverage Goals
- Tier 1: Feature Coverage (≥5 tests per feature across all 12 key features = ≥60 tests).
- Tier 2: Boundary & Corner Cases (empty data, max lengths, zero prices, edge radar values = ≥60 tests).
- Tier 3: Cross-Feature Combinations (Theme switching + Cart + Checkout + KDS + Loyalty = ≥15 tests).
- Tier 4: Real-World Application Scenarios (Full customer dining scenario, Barista rush scenario = ≥6 scenarios).
- Total target: ≥140 comprehensive test cases.
