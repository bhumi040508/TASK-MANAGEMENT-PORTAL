src/
├── components/
│   ├── kanban/
│   │   ├── Board.jsx         <-- Main Container
│   │   ├── Column.jsx        <-- To-Do, In-Progress, etc.
│   │   └── TaskCard.jsx      <-- Individual Task
│   ├── ui/                   <-- Modals, Buttons, Inputs (Shadcn style)
│   └── shared/
│       ├── Navbar.jsx
│       └── Sidebar.jsx
├── hooks/
│   └── useTasks.js           <-- Custom hook for CRUD logic
├── store/
│   └── useTaskStore.js       <-- Zustand state management
├── utils/
│   └── roles.js              <-- Admin/Viewer logic
└── App.js
