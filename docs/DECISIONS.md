# Architecture & Design Decisions

**Project**: Brand Canonizer
**Started**: 2025-12-29

---

## Decision Log

### DEC-001: Make brand_spec.json the Primary Artifact (2025-12-29)

**Context**: Initial designs focused on HTML report as the main output. User clarified that the goal is to create machine-readable specs that Claude Code can consume.

**Decision**: `brand_spec.json` is the primary artifact. HTML report is a human-friendly visualization of it.

**Rationale**:
- Claude Code needs structured, parseable data
- JSON Schema validation ensures reliability
- Separation allows independent evolution of spec format vs presentation

**Implications**:
- Evaluation must prioritize parseability and actionability
- Schema design is critical (must be stable and well-documented)
- Report generation is downstream from spec (not vice versa)

**Status**: ✅ Approved

---

### DEC-002: Use Playwright for Capture (2025-12-29)

**Context**: Need headless browser automation for screenshots and DOM extraction.

**Decision**: Use Playwright (not Puppeteer or Selenium)

**Rationale**:
- Modern API, actively maintained
- Better performance than Puppeteer
- Excellent screenshot quality
- Built-in wait/scroll utilities
- Cross-browser support (Chromium, Firefox, WebKit)

**Alternatives Considered**:
- Puppeteer: Older, less maintained
- Selenium: Heavier, slower
- Static HTML fetch: Can't execute JS, no computed styles

**Status**: ✅ Approved

---

### DEC-003: Use Claude Vision for Analysis (2025-12-29)

**Context**: Need AI model to extract brand tokens from screenshots.

**Decision**: Use Claude 3.5 Sonnet with vision capabilities

**Rationale**:
- Best-in-class vision model
- Structured output support (JSON mode)
- Already used in user's other projects
- Cost-effective for batch processing

**Alternatives Considered**:
- GPT-4V: Good but less structured output
- Local vision models: Not reliable enough for production
- Rule-based extraction: Brittle, misses nuance

**Cost Estimate**: ~$0.10-0.15 per extraction (20-40K tokens)

**Status**: ✅ Approved

---

### DEC-004: Filesystem Storage (No Database) (2025-12-29)

**Context**: Need to store extractions, reports, and artifacts.

**Decision**: Use local filesystem with structured JSON files (no database)

**Rationale**:
- Aligns with user's "local-first" philosophy
- Simple, inspectable, debuggable
- No database setup/maintenance
- Easy to version control
- Fast for small-medium datasets (<1000 extractions)

**Storage Pattern**:
```
/data/brands/{brand_id}/
  ├── metadata.json
  ├── captures/...
  ├── analysis/...
  ├── reports/...
  └── evaluations/...
```

**Scaling Strategy**: Can migrate to SQLite if >1000 extractions

**Status**: ✅ Approved

---

### DEC-005: 6-Dimension Evaluation Framework (2025-12-29)

**Context**: Need systematic quality assessment. User has successful pattern from research-hub.

**Decision**: Use 6-dimension rubric (1-5 scale, weighted average)

**Dimensions**:
1. Brand Fidelity (40%)
2. Completeness (20%)
3. Parseability (15%)
4. Actionability (15%)
5. Accessibility (5%)
6. Insight Depth (5%)

**Rationale**:
- Proven pattern from user's research-hub project
- Weighted scoring reflects priority (fidelity > completeness > parseability)
- Parsability and actionability address machine-readability goal
- 5-point scale is intuitive, easy to calibrate

**Status**: ✅ Approved

---

### DEC-006: Test-Driven Development Approach (2025-12-29)

**Context**: User explicitly requested TDD approach for reliability.

**Decision**: Write tests before implementation, maintain >80% coverage

**Test Pyramid**:
- Unit tests: 50+ (pure functions, validators)
- Integration tests: 15 (API, stage connections)
- E2E tests: 5 (full pipeline on real sites)

**Golden Sites for E2E Testing**:
1. Stripe (professional, purple brand)
2. Linear (minimalist, dark mode)
3. Notion (beige, warm palette)
4. Apple (premium, clean)
5. Shopify (vibrant, green)

**Rationale**:
- Prevents regressions
- Documents expected behavior
- Builds confidence for refactoring
- Aligns with user's quality standards

**Status**: ✅ Approved

---

### DEC-007: Frozen vs Adaptive Separation (2025-12-29)

**Context**: User wants system to learn but not evolve silently.

**Decision**: Clear separation between frozen (deterministic) and adaptive (recommended changes)

**Frozen** (requires explicit version bump):
- Extraction logic
- Report template
- Rubric criteria
- JSON Schema

**Adaptive** (can change per run):
- Recommendations for next extraction
- Prompt refinements
- Research suggestions
- Template improvement ideas

**Mechanism**: All adaptive changes stored in `recommendations.json`, must be manually reviewed and approved before applying.

**Rationale**:
- Prevents drift and "AI sludge"
- Maintains reproducibility
- User stays in control
- Clear audit trail

**Status**: ✅ Approved

---

### DEC-008: React + Vite + Tailwind for Frontend (2025-12-29)

**Context**: Need modern, fast UI. User has successful pattern from Agent Map.

**Decision**: Use React + Vite + Tailwind CSS

**Rationale**:
- User already familiar (Agent Map uses this stack)
- Vite is fast for development
- Tailwind is productive for rapid UI
- Easy to make it look professional

**Alternatives Considered**:
- Next.js: Overkill for local-first app
- Vue: User's ecosystem is React
- Plain HTML/CSS: Too slow for complex UI

**Status**: ✅ Approved

---

### DEC-009: Live Processing View (Build Log Style) (2025-12-29)

**Context**: User wants full transparency into what's happening during extraction.

**Decision**: Show live stage-by-stage progress like a build log, not generic spinner

**Format**:
```
[00:03] 🔍 Capturing website...
        └─ Loading https://stripe.com
        └─ Scrolling & capturing screenshots
        ✓ Capture complete (12.4s, 847 KB)

[00:15] 🎨 Analyzing brand identity...
        └─ Running vision model on 8 screenshots
        ...
```

**Rationale**:
- Builds trust (user sees what's happening)
- Helps debug when things go wrong
- Makes timing bottlenecks visible
- Engaging UX (not boring loader)

**Status**: ✅ Approved

---

### DEC-010: Dual-Tab Report View (2025-12-29)

**Context**: Report needs to serve both human understanding and machine inspection.

**Decision**: Two tabs in report viewer:

1. **Brand Identity Tab**: Human-friendly visual report
2. **Diagnostics Tab**: Process transparency (scores, timing, artifacts, recommendations)

**Rationale**:
- Separates concerns (aesthetic vs analytical)
- Keeps primary view clean
- Power users can dig into diagnostics
- Both views reference same underlying data

**Status**: ✅ Approved

---

### DEC-011: JSON Schema Validation (Strict) (2025-12-29)

**Context**: brand_spec.json must be reliably parseable by other systems.

**Decision**: All brand_spec.json files must validate against strict JSON Schema before being considered "complete"

**Validation Points**:
- Post-synthesis (before saving)
- Pre-evaluation (to score parseability)
- On load (when reading past specs)

**Failure Handling**: If validation fails, extraction is marked as "failed" and error logged

**Rationale**:
- Guarantees machine-readability
- Prevents downstream parsing errors in Claude Code
- Forces high-quality output
- Documents the contract explicitly

**Status**: ✅ Approved

---

### DEC-012: Semantic Token Mapping (Not Just Raw Values) (2025-12-29)

**Context**: Raw color values (#635bff) are not enough—need semantic meaning for AI to apply correctly.

**Decision**: All tokens must have semantic names and usage rules

**Example**:
```json
{
  "colors": {
    "primary": {
      "value": "#635bff",
      "semantic": "primary",
      "usage": "Main CTAs, links, active states",
      "contrast_ratio_white": 4.52
    },
    "secondary": {
      "value": "#0a2540",
      "semantic": "secondary",
      "usage": "Headers, emphasis text, dark backgrounds",
      "contrast_ratio_white": 16.31
    }
  }
}
```

**Rationale**:
- Claude Code can understand *when* to use each token
- Not just "what colors exist" but "how to use them"
- Enables correct application in new contexts

**Status**: ✅ Approved

---

### DEC-013: Node.js Backend (Not Python) (2025-12-29)

**Context**: Need to choose backend language.

**Decision**: Use Node.js + Express (not Python/FastAPI)

**Rationale**:
- JavaScript ecosystem for both frontend and backend (easier context switching)
- Playwright has excellent Node.js bindings
- JSON handling is native and fast
- User has Node.js projects (Agent Map, perplexity-clone)

**Alternative**: Python would work but adds language switching overhead

**Status**: ✅ Approved

---

### DEC-014: MVP Scope - Homepage Only (2025-12-29)

**Context**: Multi-page crawling adds complexity.

**Decision**: v1 extracts homepage + scrolls to key sections (hero, features, footer). Does NOT crawl multiple pages.

**Rationale**:
- 80% of brand identity visible on homepage
- Reduces capture time (15-30s vs 2-5min)
- Simplifies analysis
- Can add multi-page in v2 if needed

**Limitation**: May miss pricing pages, docs, etc.

**Status**: ✅ Approved (v1 only)

---

## Deferred Decisions (To Be Decided Later)

### DEF-001: Animation/Motion Extraction
**Question**: Should we detect and extract animation patterns (transitions, easing curves)?
**Status**: Deferred to Phase 4+
**Reason**: Complex, low ROI for MVP

### DEF-002: Dark Mode Detection
**Question**: Should we detect and extract dark mode tokens separately?
**Status**: Deferred to v2
**Reason**: Requires JS execution to toggle theme, adds complexity

### DEF-003: Responsive Breakpoints
**Question**: Should we extract mobile, tablet, desktop variants?
**Status**: Deferred to v2
**Reason**: Desktop extraction is sufficient for MVP

### DEF-004: Component Code Format
**Question**: Should component examples be React, Vue, HTML, or all?
**Status**: Deferred (user preference)
**Options**:
- HTML only (framework-agnostic)
- React only (user's primary framework)
- Both HTML + React

### DEF-005: Rubric Evolution Mechanism
**Question**: How should rubric criteria be updated based on research?
**Status**: Deferred to Phase 3
**Mechanism**: TBD (manual edit, AI-suggested updates, versioned templates)

---

## Rejected Ideas

### REJ-001: Automated Continuous Evolution
**Proposal**: System automatically improves extraction logic based on past failures
**Rejected**: 2025-12-29
**Reason**: User explicitly wants no silent evolution—only explicit recommendations

### REJ-002: Browser Extension
**Proposal**: Build as Chrome extension for in-browser extraction
**Rejected**: 2025-12-29
**Reason**: Local-first web app is more flexible, easier to maintain

### REJ-003: Figma Plugin (v1)
**Proposal**: Export brand_spec to Figma tokens
**Rejected**: 2025-12-29
**Reason**: Out of scope for MVP, can be v2+ feature

---

## Next Decisions Needed

1. Component code format (HTML vs React vs both)
2. Should we extract logo/imagery style? (Or just color/typography/layout)
3. How to handle sites with multiple sub-brands? (Google suite, Adobe apps)
4. Should evaluation rubric itself be scored/improved?

---

## Change Log

- 2025-12-29: Initial decisions (DEC-001 through DEC-014)
