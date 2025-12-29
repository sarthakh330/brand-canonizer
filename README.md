# Brand Canonizer

<div align="center">

**AI-Powered Design Analysis Tool**

Extract brand identity from any website → Generate machine-readable, reusable brand specifications

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Purpose

Brand Canonizer is a glass-box system that analyzes existing websites and produces **structured, machine-consumable brand identity specifications** that can be:
1. Used by Claude Code (or any AI builder) to generate matching designs
2. Inspected by humans for quality and completeness
3. Iterated on and improved over time

### Key Differentiator

Unlike generic design extraction tools, Brand Canonizer produces **actionable, parseable specifications** with full process transparency—not just pretty reports.

## Project Status

✅ **Phase 1 - Complete**: Core capture and extraction pipeline with professional UI

See [PROGRESS.md](docs/PROGRESS.md) for detailed status.

## Demo

### Landing Page
Clean, professional interface with warm aesthetic and real-time brand extraction.

![Brand Canonizer Home](docs/images/CleanShot%202024-12-29%20at%2013.38.47.png)

### Key Features
- **AI-Powered Analysis**: Claude Vision API for intelligent design pattern recognition
- **Real-Time Progress**: Server-Sent Events streaming for live extraction updates
- **Comprehensive Reports**: Complete brand specifications with quality evaluation
- **Modern UI**: Plus Jakarta Sans typography with warm beige accents (#e9d5c4)

## Architecture

```
┌─────────────┐
│   Input     │  URL + optional adjectives
└──────┬──────┘
       │
       v
┌─────────────┐
│  CAPTURE    │  Playwright → screenshots + DOM/CSS
└──────┬──────┘
       │
       v
┌─────────────┐
│  ANALYZE    │  Claude Vision → brand_tokens.json
└──────┬──────┘
       │
       v
┌─────────────┐
│ SYNTHESIZE  │  Structured → brand_spec.json + report.html
└──────┬──────┘
       │
       v
┌─────────────┐
│  EVALUATE   │  Rubric → scores + recommendations
└──────┬──────┘
       │
       v
┌─────────────┐
│   Output    │  Machine-readable spec + diagnostics
└─────────────┘
```

## Core Outputs

1. **brand_spec.json** - Machine-readable brand specification (primary artifact)
2. **report.html** - Human-readable visual report with examples
3. **evaluation.json** - Quality scores and recommendations
4. **execution_trace.json** - Process diagnostics (timing, tokens, stages)

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Extract a brand
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stripe.com", "adjectives": ["professional", "trustworthy"]}'
```

## Documentation

- [SPEC.md](docs/SPEC.md) - Complete product specification
- [DECISIONS.md](docs/DECISIONS.md) - Architecture and design decisions
- [PROGRESS.md](docs/PROGRESS.md) - Implementation progress tracking
- [Schemas](schemas/) - JSON Schema definitions for all data formats

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Capture**: Playwright (headless browser)
- **Analysis**: Claude 3.5 Sonnet (vision + structured output)
- **Storage**: Local filesystem (JSON + HTML)
- **Testing**: Jest + Playwright Test

## Non-Goals (v1)

- ❌ Not a design tool (no Figma/Sketch export)
- ❌ Not a website builder (no code generation—yet)
- ❌ Not inventing new brands (only extracting existing ones)
- ❌ Not silently evolving (explicit recommendations only)

## Success Criteria

- ✅ Extract 5 test sites with ≥4.0/5 average score
- ✅ Brand specs are machine-parseable and reusable
- ✅ Reports are visually excellent (4.5+ design quality)
- ✅ Process is fully transparent (timing, tokens, artifacts)

## License

MIT
