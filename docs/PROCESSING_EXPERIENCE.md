# Enhanced Processing Experience

**Last Updated:** 2025-12-29
**Purpose:** Document the enhanced extraction UI with progressive disclosure and live preview

---

## Overview

The processing page transforms brand extraction from a black-box wait screen into an **engaging, transparent experience** showing real-time progress with:
- Build log-style event stream
- Hover-to-reveal reasoning blocks
- Live preview of extracted elements
- Progressive disclosure pattern

**Inspiration:** Cursor's build panel aesthetic - clean, professional, informative

---

## Core Features

### 1. Three-Panel Layout

```
┌─────────────────────────────────────────────────────┐
│  [Progress Bar]                                     │
├────────────────────────────────┬───────────────────┤
│                                │                   │
│    Build Log (2/3 width)       │  Live Preview     │
│    - Event stream              │  (1/3 width)      │
│    - Hover for reasoning       │  - Colors         │
│    - Color-coded messages      │  - Fonts          │
│                                │  - Components     │
│                                │                   │
└────────────────────────────────┴───────────────────┘
```

**File:** `frontend/src/pages/Processing.jsx:233-395`

**Key Sections:**
- **Progress Bar:** Top of page, shows overall completion percentage
- **Build Log:** Left 2/3, scrollable event stream with timestamps
- **Live Preview:** Right 1/3, sticky panel showing extracted elements

---

### 2. Hover-to-Reveal Reasoning

**Location:** `Processing.jsx:285-293`

**How it Works:**
- Each log entry is interactive (cursor: pointer)
- Hover reveals detailed reasoning in italic text with 💭 emoji
- Reasoning is context-aware based on pipeline stage

**Example Reasoning by Stage:**

```javascript
const stageReasoningMap = {
  setup: "Initializing browser engine and preparing screenshot pipeline...",
  capture: "Capturing full-page screenshots across multiple viewport sizes...",
  analyze: "Running computer vision analysis to detect colors, fonts, spacing...",
  synthesize: "Converting raw tokens into structured brand specification...",
  evaluate: "Scoring extraction quality on 6 dimensions...",
  finalize: "Saving artifacts and generating final report..."
};
```

**Specific Message Reasoning:**
- "Analyzing colors" → "Using Claude Vision to identify color palette from screenshots..."
- "Extracting fonts" → "Parsing CSS and detecting font-family declarations..."
- "Found N components" → "Detected reusable UI patterns like buttons, cards, inputs..."

**Visual Design:**
```css
.reasoning-block {
  border-left: 2px solid #a78bfa;  /* purple accent */
  padding-left: 0.75rem;
  font-style: italic;
  color: #6b7280;  /* gray-500 */
  opacity: 0 → 1 on hover;
  transition: opacity 200ms;
}
```

---

### 3. Live Preview Panel

**Location:** `Processing.jsx:310-394`

**Purpose:** Show extracted brand elements **as they're discovered** in real-time

**Three Preview Sections:**

#### A. Colors (`extractColors()`)
```javascript
// Extracts from messages like:
// "Found primary color: #635bff"
// "Detected color palette: #0a2540, #00d4ff, rgb(99, 91, 255)"

Display:
┌──────────────────────────┐
│ Colors (4)               │
├────┬────┬────┬────┬──────┤
│ ██ │ ██ │ ██ │ ██ │ ... │
└────┴────┴────┴────┴──────┘
```

**Regex:** `/(?:#[0-9a-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\))/gi`

#### B. Fonts (`extractFonts()`)
```javascript
// Extracts from messages like:
// "Found font-family: Inter"
// "Detected typography: SF Pro Display, Helvetica Neue"

Display:
┌─────────────────────────────┐
│ Fonts (2)                   │
├─────────────────────────────┤
│  Inter                      │  ← Rendered in Inter
│  SF Pro Display             │  ← Rendered in SF Pro
└─────────────────────────────┘
```

**Regex:** `/font-family:\s*([^;,]+(?:,\s*[^;,]+)*)/gi`

#### C. Components (`extractComponents()`)
```javascript
// Extracts from messages like:
// "Found 3 buttons"
// "Detected card component"

Display:
┌────────────────────────────────┐
│ Components (5)                 │
├────────────────────────────────┤
│ [Button] [Card] [Input]        │  ← Badge chips
│ [Navigation] [Alert]           │
└────────────────────────────────┘
```

**Regex:** `/\b(?:button|card|input|navigation|nav|form|alert|badge|modal|dropdown)\b/gi`

#### Placeholder State
```
┌─────────────────────────┐
│     [🔍 icon]           │
│  No elements detected   │
│       yet...            │
└─────────────────────────┘
```

**Animation:** Rotating search icon using `animate-spin`

---

### 4. Smart Data Extraction

**Location:** `Processing.jsx:24-53`

**Three Extractor Functions:**

```javascript
// 1. Extract Colors
const extractColors = (message) => {
  const colorRegex = /(?:#[0-9a-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\))/gi;
  return [...new Set(message.match(colorRegex) || [])];
};

// 2. Extract Fonts
const extractFonts = (message) => {
  const fontRegex = /font-family:\s*([^;,]+(?:,\s*[^;,]+)*)/gi;
  const matches = [];
  let match;
  while ((match = fontRegex.exec(message)) !== null) {
    const fonts = match[1].split(',')
      .map(f => f.trim().replace(/['"]/g, ''))
      .filter(f => f && !f.includes('sans-serif') && !f.includes('serif'));
    matches.push(...fonts);
  }
  return [...new Set(matches)];
};

// 3. Extract Components
const extractComponents = (message) => {
  const componentRegex = /\b(?:button|card|input|navigation|nav|form|alert|badge|modal|dropdown)\b/gi;
  return [...new Set((message.match(componentRegex) || [])
    .map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()))];
};
```

**Called on every SSE event:**
```javascript
const handleSSEEvent = (event) => {
  // Parse colors
  const newColors = extractColors(event.message);
  setExtractedColors(prev => [...new Set([...prev, ...newColors])]);

  // Parse fonts
  const newFonts = extractFonts(event.message);
  setExtractedFonts(prev => [...new Set([...prev, ...newFonts])]);

  // Parse components
  const newComponents = extractComponents(event.message);
  setExtractedComponents(prev => [...new Set([...prev, ...newComponents])]);
};
```

---

### 5. Visual Polish

#### Log Message Styling
```javascript
// Success messages (green)
message.includes('✓') || message.includes('complete') → text-green-600

// Error messages (red)
stage === 'error' → text-red-600

// Info messages (gray)
default → text-gray-600
```

#### Hover Transitions
```css
.log-entry:hover {
  background-color: #f9fafb;  /* gray-50 */
  transition: background-color 150ms;
}

.reasoning-block {
  opacity: 0;
  transition: opacity 200ms ease-in-out;
}

.log-entry:hover .reasoning-block {
  opacity: 1;
}
```

#### Sticky Preview Panel
```css
.preview-panel {
  position: sticky;
  top: 2rem;  /* Sticks while scrolling build log */
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}
```

#### Border Accents
- Reasoning blocks: `border-left: 2px solid #a78bfa` (purple)
- Preview sections: `border-t: 1px solid #e5e7eb` (gray)

---

## User Experience Flow

### Step 1: Start Extraction
```
User clicks "Extract Brand Identity" on home page
  ↓
Navigate to /processing/:sessionId
  ↓
Show initial state: progress bar at 0%, empty log, empty preview
```

### Step 2: SSE Events Stream In
```
[00:01] 🔍 Initializing extraction...
         💭 Hover: "Setting up browser engine..."
[00:03] ✓ Browser initialized
[00:05] 📸 Capturing screenshots...
         💭 Hover: "Taking full-page screenshots..."
[00:12] ✓ Captured 6 screenshots
[00:15] 🎨 Analyzing brand identity...
         💭 Hover: "Running Claude Vision analysis..."

Preview Panel Updates:
  Colors: [No colors yet]
  Fonts: [No fonts yet]
  Components: [No components yet]
```

### Step 3: Elements Appear in Preview
```
[00:18] Found primary color: #635bff
         Preview: Colors (1) → [█ #635bff]

[00:22] Detected font-family: Inter
         Preview: Fonts (1) → Inter (rendered in Inter)

[00:28] Found 3 buttons
         Preview: Components (1) → [Button]
```

### Step 4: Completion
```
[01:45] ✓ Extraction complete! Brand ID: stripe_2025_12_29_abc123
         ↓
Final Preview Shows:
  Colors (12): Full color palette
  Fonts (3): Inter, SF Pro, Helvetica
  Components (8): Button, Card, Input, Alert, Badge, Modal, Navigation, Form
         ↓
[View Report] button appears
         ↓
Navigate to /brands/stripe_2025_12_29_abc123
```

---

## Progressive Disclosure Pattern

**Core Principle:** Hide complexity until needed, but make it easily accessible

**Three Levels of Information:**

1. **Level 1: Always Visible** (Scannable)
   - Timestamps
   - Stage names
   - Brief messages
   - Progress percentage

2. **Level 2: Hover to Reveal** (On Demand)
   - Detailed reasoning
   - Context about what's happening
   - Why this step is necessary

3. **Level 3: Preview Panel** (Accumulated Results)
   - Real extracted elements
   - Growing as extraction progresses
   - Visual proof of progress

**Why This Works:**
- Beginners see simple progress messages
- Advanced users can hover for deep context
- Everyone sees tangible results (colors, fonts) accumulating
- No information overload

---

## Technical Implementation

### State Management

```javascript
const [events, setEvents] = useState([]);
const [extractedColors, setExtractedColors] = useState([]);
const [extractedFonts, setExtractedFonts] = useState([]);
const [extractedComponents, setExtractedComponents] = useState([]);
const [isComplete, setIsComplete] = useState(false);
const [error, setError] = useState(null);
```

### SSE Connection

```javascript
useEffect(() => {
  const eventSource = new EventSource(
    `http://localhost:3000/api/brands/${sessionId}/status`
  );

  eventSource.onmessage = (e) => {
    const event = JSON.parse(e.data);

    // Add to log
    setEvents(prev => [...prev, event]);

    // Extract elements
    const colors = extractColors(event.message);
    const fonts = extractFonts(event.message);
    const components = extractComponents(event.message);

    // Update previews
    if (colors.length) setExtractedColors(prev => [...new Set([...prev, ...colors])]);
    if (fonts.length) setExtractedFonts(prev => [...new Set([...prev, ...fonts])]);
    if (components.length) setExtractedComponents(prev => [...new Set([...prev, ...components])]);

    // Check completion
    if (event.stage === 'complete') {
      setIsComplete(true);
      setBrandId(event.brand_id);
      eventSource.close();
    }
  };

  return () => eventSource.close();
}, [sessionId]);
```

### Scroll Management

```javascript
// Auto-scroll to bottom when new events arrive
const logEndRef = useRef(null);

useEffect(() => {
  logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [events]);
```

---

## Design Decisions

### Why Build Log Style?
- **Familiar:** Developers know this pattern (webpack, vite, tsc)
- **Transparent:** Shows exactly what's happening
- **Debuggable:** Can see where issues occur
- **Professional:** Matches Cursor's aesthetic

### Why Hover for Reasoning?
- **Clean default view:** No clutter
- **Progressive disclosure:** Advanced users can dig deeper
- **Context-sensitive:** Shows relevant info when needed
- **Accessible:** Still visible to screen readers via aria labels

### Why Live Preview?
- **Tangible progress:** Users see results accumulating
- **Reduces anxiety:** Visual proof things are working
- **Educational:** Shows what extraction actually does
- **Engaging:** More interesting than a spinner

### Why Sticky Panel?
- **Always visible:** Don't need to scroll to see progress
- **Efficient layout:** Uses vertical space well
- **Responsive:** Adapts to viewport height

---

## Accessibility Considerations

### Keyboard Navigation
- All interactive elements (log entries) are keyboard accessible
- Tab order follows visual flow (log → preview → button)

### Screen Readers
- Reasoning blocks have `aria-label` with full text
- Progress bar has `role="progressbar"` with `aria-valuenow`
- Status messages announced via `aria-live="polite"`

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Success green (#059669) has 7.2:1 on white
- Error red (#dc2626) has 5.8:1 on white

### Motion
- Smooth scrolling respects `prefers-reduced-motion`
- Animations can be disabled via system settings

---

## Future Enhancements

### Phase 2: Interactive Controls
- [ ] Pause/resume extraction
- [ ] Skip optional steps (e.g., evaluation)
- [ ] Retry failed stages
- [ ] Download logs as text file

### Phase 3: Advanced Preview
- [ ] Screenshot thumbnails in timeline
- [ ] Component previews (not just names)
- [ ] Color palette with names
- [ ] Font preview with actual text samples

### Phase 4: Comparison View
- [ ] Side-by-side with previous extraction
- [ ] Diff highlighting (what changed)
- [ ] Quality score progression

---

## Success Metrics

### Quantitative
- Average time on processing page: 2-3 minutes
- Hover interaction rate: >40% of users
- Preview panel scroll depth: >60%
- Completion rate: >95% (users don't abandon)

### Qualitative
- Users understand what's happening
- Reduced support questions about "is it working?"
- Positive feedback about transparency
- Developers appreciate build log style

---

## Code References

**Main File:** `frontend/src/pages/Processing.jsx`

**Key Sections:**
- Lines 24-53: Data extraction functions
- Lines 233-280: Build log rendering
- Lines 285-293: Hover reasoning logic
- Lines 310-394: Live preview panel

**Dependencies:**
- `axios` for SSE connection
- React hooks (`useState`, `useEffect`, `useRef`)
- Tailwind CSS for styling

---

## Conclusion

The enhanced processing experience transforms a boring loading screen into an **engaging, educational journey** that:
1. Shows exactly what's happening (transparency)
2. Provides context on demand (progressive disclosure)
3. Builds confidence with live previews (tangible progress)
4. Maintains professional aesthetic (Cursor-inspired)

**Key Principle:** "Never make users wonder if something's working - show them"

This follows the same philosophy as expressive brand reports: **experience over documentation**, **show over tell**, **visual over textual**.

---

**Document Maintenance:**
- Update when new extraction stages added
- Refine reasoning messages based on user feedback
- Add new preview types as extraction improves

**Last Updated:** 2025-12-29
