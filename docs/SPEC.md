# Brand Canonizer - Product Specification

**Version**: 1.0.0
**Date**: 2025-12-29
**Status**: Phase 1 - In Development

---

## Product Vision

**Transform implicit visual brand identity into explicit, machine-readable specifications that AI systems can parse and apply.**

## Problem Statement

Current limitations:
1. General-purpose AI agents produce generic, inconsistent designs
2. Users lack vocabulary to articulate design improvements
3. No systematic way to capture and reuse brand identity
4. No way to tell Claude Code "match this brand's style"

## Solution

A glass-box system that:
1. **Extracts** brand identity from existing websites with high fidelity
2. **Structures** the identity into machine-parseable JSON specifications
3. **Evaluates** extraction quality on fidelity, parseability, and actionability
4. **Improves** iteratively with full process transparency

---

## Core Use Case

### Primary Flow

```
Designer/Developer → Provides URL
                   ↓
Brand Canonizer → Analyzes website
                   ↓
                → Produces brand_spec.json
                   ↓
Claude Code → Reads brand_spec.json
                   ↓
             → Generates new pages matching the brand
```

### Key Insight

**The brand_spec.json is the product.** The HTML report is a human-friendly view of it.

---

## User Flows

### 1. Extract New Brand (MVP)

```
1. User enters URL (e.g., "https://stripe.com")
2. Optional: Add brand adjectives ("professional", "trustworthy")
3. Click "Extract Brand Identity"
4. See live processing view:
   - Stage 1: Capturing (15-30s)
   - Stage 2: Analyzing (20-40s)
   - Stage 3: Synthesizing (30-60s)
   - Stage 4: Evaluating (15-30s)
5. View final report with two tabs:
   - Brand Identity (the spec, visualized)
   - Diagnostics (scores, timing, recommendations, artifacts)
```

### 2. Browse Past Extractions

```
1. Home page shows gallery of past brands
2. Each card displays:
   - Brand name + URL
   - Dominant colors (visual preview)
   - Overall score
   - Date extracted
3. Click to view full report
```

### 3. Re-extract with Improvements (Phase 2)

```
1. Open past report
2. Review "Recommendations" section
3. Click "Re-extract with improvements"
4. System applies suggested refinements
5. View side-by-side comparison (v1 vs v2)
```

### 4. Use Spec in Claude Code (Future)

```
1. Copy brand_id or download brand_spec.json
2. In Claude Code session:
   "Create a new landing page matching brand_spec_stripe_v2.json"
3. Claude Code reads and applies:
   - Color tokens
   - Typography scale
   - Spacing rules
   - Component patterns
```

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  - URL input & form                                  │
│  - Live processing view                              │
│  - Report viewer (Brand Identity + Diagnostics tabs) │
│  - Past extractions gallery                          │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────┴────────────────────────────────┐
│                  Backend (Node.js)                   │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Capture    │→ │   Analyze    │→ │Synthesize │ │
│  │  (Playwright)│  │(Claude Vision)│  │  (Report) │ │
│  └──────────────┘  └──────────────┘  └─────┬─────┘ │
│                                             │       │
│                    ┌────────────────────────┘       │
│                    v                                │
│              ┌──────────┐                           │
│              │ Evaluate │                           │
│              │ (Rubric) │                           │
│              └──────────┘                           │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│              Storage (Filesystem)                    │
│  /brands/{id}/                                       │
│    ├── metadata.json                                 │
│    ├── captures/ (screenshots, DOM, CSS)             │
│    ├── analysis/ (brand_tokens.json)                 │
│    ├── reports/ (brand_spec.json, index.html)        │
│    └── evaluations/ (scores, recommendations)        │
└──────────────────────────────────────────────────────┘
```

### Pipeline Stages (Detailed)

#### Stage 1: CAPTURE (15-30s)

**Input**: URL string

**Process**:
1. Launch headless browser (Playwright)
2. Navigate to URL
3. Scroll through page (capture viewport changes)
4. Screenshot: homepage, key sections (3-5 screenshots)
5. Extract DOM structure (semantic HTML)
6. Extract computed CSS for key elements (colors, fonts, spacing)

**Output**:
```json
{
  "screenshots": ["hero.png", "features.png", "footer.png"],
  "dom": {...},
  "styles": {
    "colors": ["#635bff", "#0a2540", ...],
    "fonts": ["Inter", "SFMono-Regular"],
    "computed_styles": [...]
  }
}
```

**Success Criteria**: All screenshots are high-quality (1920x1080+), DOM is complete

---

#### Stage 2: ANALYZE (20-40s)

**Input**: Screenshots + DOM/CSS data

**Process**:
1. Send screenshots to Claude Vision with structured prompt:
   - "Extract all colors used, categorize by semantic purpose"
   - "Identify typography scale and hierarchy rules"
   - "Detect spacing patterns and layout grid"
   - "Identify component patterns (buttons, inputs, cards)"
2. Parse response into structured tokens
3. Cross-reference with DOM/CSS data for validation

**Output**: `brand_tokens.json` (see schema)

**Success Criteria**: All token categories populated, no hallucinations

---

#### Stage 3: SYNTHESIZE (30-60s)

**Input**: `brand_tokens.json` + user adjectives

**Process**:
1. Convert raw tokens into canonical brand spec format
2. Add semantic mapping (primary/secondary/accent/neutral)
3. Generate usage rules for each token category
4. Create component examples with code snippets
5. Render HTML report using template
6. Generate pattern descriptions and do/don't rules

**Output**:
- `brand_spec.json` (machine-readable, canonical format)
- `report.html` (human-readable, visual report)

**Success Criteria**: Spec is valid per JSON Schema, report renders correctly

---

#### Stage 4: EVALUATE (15-30s)

**Input**: `brand_spec.json` + `report.html` + original screenshots

**Process**:
1. Run rubric evaluation (6 dimensions)
2. Compare spec tokens against original screenshots (fidelity check)
3. Validate JSON schema compliance (parseability check)
4. Assess actionability (are rules clear and sufficient?)
5. Generate recommendations for improvement

**Output**: `evaluation.json` (scores + justifications + recommendations)

**Success Criteria**: All 6 dimensions scored with clear justifications

---

## Data Models (Core Schemas)

### 1. brand_spec.json (Primary Artifact)

The machine-readable specification that other systems consume.

**Key Requirements**:
- ✅ JSON Schema validated
- ✅ Fully self-contained (no external references)
- ✅ Semantic token mapping (not just raw values)
- ✅ Usage rules included (not just values)
- ✅ Examples embedded (for context)

See [schemas/brand_spec.schema.json](../schemas/brand_spec.schema.json) for full definition.

**Top-level structure**:
```json
{
  "version": "1.0.0",
  "metadata": {...},
  "brand_essence": {...},
  "design_tokens": {
    "colors": {...},
    "typography": {...},
    "spacing": {...},
    "effects": {...}
  },
  "components": [...],
  "patterns": [...],
  "accessibility": {...}
}
```

---

### 2. evaluation.json

**Structure**:
```json
{
  "version": "1.0.0",
  "rubric_version": "1.2.0",
  "overall_score": 4.2,
  "dimensions": [
    {
      "name": "brand_fidelity",
      "score": 4.0,
      "justification": "...",
      "evidence": [...]
    },
    ...
  ],
  "recommendations": [...],
  "metadata": {...}
}
```

---

### 3. execution_trace.json

**Structure**:
```json
{
  "pipeline_version": "1.0.0",
  "stages": [
    {
      "name": "capture",
      "start_time": "2025-12-29T10:23:45Z",
      "end_time": "2025-12-29T10:24:03Z",
      "duration_ms": 18234,
      "status": "success",
      "artifacts": ["screenshots/hero.png", ...],
      "errors": []
    },
    ...
  ],
  "total_duration_ms": 81243,
  "total_tokens": 94532,
  "estimated_cost_usd": 0.14
}
```

---

## Evaluation Framework

### Rubric v1.0.0 (6 Dimensions)

**Scoring**: 1-5 scale (1=poor, 5=excellent)

1. **Brand Fidelity** (40% weight)
   - How accurately does the spec capture the original brand?
   - Are colors, typography, and spacing correct?
   - Do component patterns match the source?

2. **Completeness** (20% weight)
   - Are all essential tokens present?
   - Are at least 8 components documented?
   - Are patterns covered (navigation, hero, CTAs)?

3. **Parseability** (15% weight)
   - Does the JSON validate against schema?
   - Are all fields properly typed and structured?
   - Can a machine unambiguously parse and apply this spec?

4. **Actionability** (15% weight)
   - Are usage rules clear and specific?
   - Can a designer/developer build from this?
   - Are examples sufficient for understanding?

5. **Accessibility** (5% weight)
   - Are contrast issues flagged?
   - Is typography readable (size, line-height)?
   - Are touch targets adequate?

6. **Insight Depth** (5% weight)
   - Does it explain *why* choices were made?
   - Does it capture brand essence (adjectives, tone)?
   - Does it note patterns/trends?

**Overall Score**: Weighted average

**Quality Bands**:
- 4.5-5.0: Excellent (production-ready)
- 4.0-4.4: Good (minor improvements needed)
- 3.5-3.9: Acceptable (significant gaps)
- Below 3.5: Poor (needs major rework)

---

## Success Criteria

### Phase 1 Exit Criteria

- [ ] Can capture and analyze 5 test sites:
  - Stripe, Linear, Notion, Apple, Shopify
- [ ] All brand_spec.json files validate against JSON Schema
- [ ] Average evaluation score ≥ 4.0 across all dimensions
- [ ] Reports render correctly with all sections populated
- [ ] Process timing averages 2-3 minutes per extraction
- [ ] All tests pass (unit + integration)

### Phase 2 Exit Criteria

- [ ] Diagnostics tab fully functional
- [ ] Past extractions gallery works
- [ ] Evaluation scores visible in UI
- [ ] Recommendations generate successfully
- [ ] Can re-extract same brand and compare versions

### Phase 3 Exit Criteria

- [ ] Can trigger manual research tasks
- [ ] Research memos stored in knowledge base
- [ ] Rubric can be updated based on research
- [ ] Version tracking works (v1 vs v2 comparison)

---

## Non-Goals (Explicit Scope Boundaries)

### v1 Non-Goals

- ❌ **No design tool integration**: No Figma, Sketch, or Adobe XD plugins
- ❌ **No code generation**: System extracts, doesn't build (that's Claude Code's job later)
- ❌ **No brand invention**: Only extracts from existing sites, doesn't create from scratch
- ❌ **No silent evolution**: All improvements must be explicit recommendations, not automatic
- ❌ **No animation extraction**: Motion/transitions are v2+ feature
- ❌ **No A/B testing**: Single extraction per run, no variants

### Future Possibilities (Post-v1)

- 🔮 Claude Code integration (read brand_spec.json, generate matching designs)
- 🔮 Figma export (convert brand_spec to Figma tokens)
- 🔮 Component library generation (create React/Vue components from patterns)
- 🔮 Brand comparison (diff two brands, find similarities)
- 🔮 Animation/motion pattern extraction
- 🔮 Multi-page deep analysis (not just homepage)

---

## Testing Strategy

### Test Pyramid

```
       ┌─────────────┐
       │  E2E Tests  │  (5) Full pipeline on real sites
       ├─────────────┤
       │Integration  │  (15) API endpoints, stage connections
       │   Tests     │
       ├─────────────┤
       │Unit Tests   │  (50+) Pure functions, schemas, validators
       └─────────────┘
```

### Test-Driven Development Approach

**Golden Rule**: Write test first, then implementation

**Test Categories**:

1. **Schema Validation Tests** (must pass)
   - brand_spec.json validates against JSON Schema
   - No required fields missing
   - All enums match allowed values

2. **Extraction Quality Tests** (target 4.0+ score)
   - Stripe extraction captures purple primary color
   - Linear extraction captures SF Pro font
   - Notion extraction captures beige neutral palette

3. **Parseability Tests** (must pass)
   - Claude Code can read and apply brand_spec.json
   - All color tokens have semantic names
   - Typography scale is unambiguous

4. **Pipeline Reliability Tests** (must pass)
   - Pipeline completes end-to-end without errors
   - All stages produce expected artifacts
   - Execution trace is complete

5. **Regression Tests** (must maintain)
   - Re-extracting same site produces same spec (within tolerance)
   - Spec version updates don't break old specs

---

## Implementation Phases

### Phase 1: Core Pipeline (Week 1-2) 🚧 In Progress

**Goal**: One perfect end-to-end extraction

- [x] Project structure and documentation
- [ ] JSON Schemas for all data formats
- [ ] Playwright capture implementation
- [ ] Claude Vision analysis implementation
- [ ] Synthesis into brand_spec.json
- [ ] Basic evaluation (manual rubric)
- [ ] Unit tests for each stage
- [ ] Integration test (full pipeline)

**Exit**: Can extract Stripe.com with 4.0+ score

---

### Phase 2: UI & Diagnostics (Week 3)

**Goal**: Glass-box experience

- [ ] React frontend (URL input, gallery)
- [ ] Live processing view with stage updates
- [ ] Report viewer (Brand Identity + Diagnostics tabs)
- [ ] Past extractions gallery
- [ ] Evaluation scores display
- [ ] Timing and token usage display
- [ ] Download artifacts (JSON, screenshots)

**Exit**: Full UI works, process is transparent

---

### Phase 3: Learning Loop (Week 4)

**Goal**: Iterative improvement

- [ ] Recommendations generation
- [ ] Re-extract with improvements
- [ ] Version comparison (v1 vs v2 diff)
- [ ] Manual research workflow
- [ ] Knowledge base storage
- [ ] Rubric versioning

**Exit**: Can improve extractions over multiple iterations

---

### Phase 4: Self-Design (Week 5+)

**Goal**: System critiques its own design

- [ ] Dual evaluation (brand fidelity + report quality)
- [ ] Report template improvements
- [ ] Research on design system docs
- [ ] Automated template versioning
- [ ] Report design score tracking

**Exit**: Reports are consistently 4.5+ design quality

---

## Open Questions / To Be Decided

- [ ] Should we support dark mode detection?
- [ ] How to handle responsive breakpoints (mobile vs desktop)?
- [ ] Should we extract illustration/icon style?
- [ ] How to detect and extract grid systems?
- [ ] Should component code snippets be React, Vue, HTML, or all?
- [ ] How to version the brand_spec format itself?

---

## References

- [ChatGPT Conversation (Initial Brainstorm)](../docs/chatgpt_conversation.md)
- [DECISIONS.md - Architecture Decisions](./DECISIONS.md)
- [PROGRESS.md - Implementation Status](./PROGRESS.md)
- [JSON Schemas](../schemas/)
