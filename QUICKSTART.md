# Brand Canonizer - Quick Start Guide

## 🚀 Start the Application

### Option 1: Both Servers Together
```bash
npm run dev
```

### Option 2: Separate Terminals
```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Frontend UI
cd frontend && npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173 (or next available port)
- **Backend API**: http://localhost:3000
- **API Status**: http://localhost:3000/api/status

## 📖 User Journey

### 1. View Existing Brands
1. Open frontend URL
2. Scroll to "Past Extractions" gallery
3. Click any brand card to view detailed report

### 2. Extract New Brand
1. Enter website URL (e.g., https://airbnb.com)
2. (Optional) Add brand adjectives
3. Click "Extract Brand Identity"
4. Watch real-time progress
5. View generated report

### 3. Explore Inspirations
1. Click "Design Inspirations" button
2. Browse 4 curated design examples
3. Read selection framework

## 📊 Report Tabs

### Brand Identity Tab
- Brand essence and adjectives
- Color palette with swatches
- Typography scale with live previews
- Spacing system visualization
- UI components showcase
- Design patterns

### Diagnostics Tab
- Evaluation scores (6 dimensions)
- Recommendations for improvement
- Execution timeline
- Token usage and cost
- Downloadable artifacts

## 🎨 Features

✅ Real-time progress with SSE
✅ Beautiful, responsive UI
✅ Comprehensive brand reports
✅ Visual component previews
✅ Design inspiration gallery
✅ Quality scoring system
✅ Glass-box transparency (full execution details)

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Server-Sent Events (SSE)
- Playwright (website capture)
- Anthropic Claude API

**Frontend:**
- React 19
- React Router
- Tailwind CSS
- Axios
- React Syntax Highlighter

## 📁 Key Files

- `src/server.js` - Express API server
- `frontend/src/App.jsx` - React router
- `frontend/src/pages/` - 4 main pages
- `frontend/src/components/` - 6 reusable components
- `data/brands/` - Extracted brand data

## 🐛 Troubleshooting

**Port already in use:**
- Frontend will auto-find next available port (5174, 5175, etc.)
- Backend needs port 3000 free

**API connection error:**
- Ensure backend is running on http://localhost:3000
- Check `.env` file in frontend directory

**No brands showing:**
- Run at least one extraction first
- Check `data/brands/` directory exists

## 📚 Documentation

- `PHASE_2_IMPLEMENTATION.md` - Complete implementation details
- `README.md` - Project overview
- `docs/` - Architecture and design docs

---

**Ready to extract your first brand identity?** 🎨
