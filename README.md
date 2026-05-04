# CompilerX — Six-Phase Compiler Visualizer (MERN Stack)

A full-stack MERN application that implements and visualizes all 6 phases of a compiler for a simple C-like language.

---

## Language Supported

A simple C-like language with:
- **Types**: `int`, `float`, `bool`, `string`
- **Control flow**: `if / else`, `while`
- **Statements**: variable declaration, assignment, `return`, `print`
- **Operators**: arithmetic, relational, logical, compound assignment

### Example Program
```c
int x = 10;
int y = 20;
int sum = x + y;

if (sum > 25) {
  int result = sum * 2;
  print(result);
} else {
  print(sum);
}

int i = 0;
while (i < 5) {
  i = i + 1;
  print(i);
}

return sum;
```

---

## Architecture

```
compiler-project/
├── backend/
│   ├── src/
│   │   ├── index.js                   Express + MongoDB server
│   │   ├── models/
│   │   │   └── CompilerSession.js     Mongoose schema (all 6 phases)
│   │   ├── routes/
│   │   │   └── compiler.js            REST API endpoints
│   │   └── compiler/
│   │       ├── lexer.js               Phase 1 — Lexical Analysis
│   │       ├── parser.js              Phase 2 — Syntax Analysis + Parse Table
│   │       ├── semantic.js            Phase 3 — Semantic Analysis + Symbol Table
│   │       ├── ir_generator.js        Phase 4 — IR (Three Address Code)
│   │       ├── optimizer.js           Phase 5 — Code Optimization
│   │       └── code_generator.js      Phase 6 — x86-64 Assembly
│   └── package.json
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── App.js                     Main UI + phase routing
│       ├── App.css                    All styles
│       └── components/
│           ├── TokenTable.js          Phase 1 output
│           ├── ParseTreeView.js       Phase 2 parse tree
│           ├── index.js               Symbol table, parse table, code view, history
│           └── *.js                   Re-export stubs
└── README.md
```

---

## Compiler Phases

| # | Phase | Output | Stored in DB |
|---|-------|--------|-------------|
| 1 | **Lexical Analysis** | Token list (type, value, line, col) | `tokens[]`, `lexicalErrors[]` |
| 2 | **Syntax Analysis** | Parse tree + LL(1) parse table | `parseTree`, `parseTable[]` |
| 3 | **Semantic Analysis** | Symbol table + type-annotated AST | `symbolTable`, `annotatedTree` |
| 4 | **Intermediate Code** | Three Address Code (TAC) | `intermediateCode[]` |
| 5 | **Code Optimization** | Optimized TAC + optimization log | `optimizedCode[]`, `optimizations[]` |
| 6 | **Code Generation** | x86-64 AT&T Assembly | `targetCode[]` |

### Optimizations Implemented
- **Constant Folding** — `10 + 20` → `30` at compile time
- **Copy Propagation** — replace variable refs with their known values
- **Dead Code Elimination** — remove assignments to unused temporaries
- **Common Subexpression Elimination (CSE)** — reuse previously computed expressions

---

## Setup & Run

### Prerequisites
- Node.js 16+
- MongoDB running locally on port 27017 (or provide a URI)

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env if needed
npm install
npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
# Proxies /api to http://localhost:5000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/compile` | Compile source code, run all 6 phases, save to DB |
| GET | `/api/sessions` | List last 20 sessions |
| GET | `/api/sessions/:id` | Get full session by ID |
| DELETE | `/api/sessions/:id` | Delete a session |
| GET | `/api/health` | Health check |

### POST /api/compile — Request Body
```json
{ "sourceCode": "int x = 5;\nreturn x;" }
```

### POST /api/compile — Response
```json
{
  "sessionId": "...",
  "phases": {
    "lexical":      { "tokens": [...], "errors": [] },
    "syntax":       { "parseTree": {...}, "parseTable": [...], "errors": [] },
    "semantic":     { "symbolTable": [...], "errors": [], "annotatedTree": {...} },
    "ir":           { "code": [...], "type": "Three Address Code (TAC)" },
    "optimization": { "code": [...], "optimizations": [...] },
    "codeGen":      { "code": [...], "arch": "x86-64 (AT&T Syntax)" }
  }
}
```

---

## Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--bg` | `#FAF3E1` | Main background |
| `--bg2` | `#F5E7C6` | Panel headers, secondary bg |
| `--accent` | `#FA8112` | Orange — highlights, active states |
| `--dark` | `#222222` | Header, code background |
