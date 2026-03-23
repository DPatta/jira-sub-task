# TodoList App

A modern TodoList application built with Next.js, TypeScript, Tailwind CSS, and Radix UI.

## Features

- ✅ Add, edit, and delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Filter todos (All, Active, Completed)
- ✅ Clear completed todos
- ✅ Local storage persistence
- ✅ Modern UI with Radix UI components
- ✅ Responsive design
- ✅ Dark mode support

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Class Variance Authority (CVA)** - Component variants
- **Radix UI** - Accessible UI components
- **Lucide React** - Beautiful icons

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/
│   ├── globals.css       # Global styles with Tailwind
│   └── page.tsx         # Home page
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── button.tsx
│   │   ├── checkbox.tsx
│   │   └── input.tsx
│   ├── AddTodo.tsx      # Add todo form
│   ├── TodoItem.tsx     # Individual todo item
│   └── TodoList.tsx     # Main todo list component
├── lib/
│   └── utils.ts         # Utility functions
└── types/
    └── todo.ts          # TypeScript types
```

## Key Components

- **TodoList**: Main component managing state and localStorage
- **TodoItem**: Individual todo with edit/delete functionality
- **AddTodo**: Form for adding new todos
- **UI Components**: Styled with CVA for consistent variants

## Features in Detail

### Todo Management
- Create todos with enter key or plus button
- Edit todos inline with escape to cancel
- Delete todos with confirmation
- Toggle completion status

### Filtering
- View all todos
- Filter active (incomplete) todos
- Filter completed todos
- Clear all completed todos at once

### Persistence
- All todos saved to localStorage
- Automatic save on any change
- Restored on page load

### Accessibility
- Built with Radix UI for accessibility
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Customization

The app uses Tailwind CSS with a custom design system. Colors and components can be customized in:

- `tailwind.config.js` - Tailwind configuration
- `src/app/globals.css` - CSS custom properties
- `src/components/ui/` - Component variants with CVA
