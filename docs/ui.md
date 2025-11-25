# UI Coding Standards

This document outlines the strict UI coding standards for this project. All developers must adhere to these guidelines when building user interfaces.

---

## Component Library

### shadcn/ui - REQUIRED

**ONLY [shadcn/ui](https://ui.shadcn.com/) components SHALL be used throughout this project.**

#### Key Rules:
1. **NO custom UI components** should be created
2. **ALL UI components** must come from the shadcn/ui library
3. If a component doesn't exist in shadcn/ui, consult with the team before proceeding
4. Follow the [shadcn/ui installation guide](https://ui.shadcn.com/docs/installation/next) for adding new components

#### Installing shadcn/ui Components

When you need a new component, install it via the CLI:

```bash
npx shadcn@latest add [component-name]
```

Examples:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
```

#### Available Components

Refer to the [shadcn/ui components documentation](https://ui.shadcn.com/docs/components) for the full list of available components:

- **Forms**: Button, Input, Textarea, Select, Checkbox, Radio Group, Switch, Label, Form
- **Layout**: Card, Separator, Aspect Ratio, Scroll Area
- **Navigation**: Navigation Menu, Tabs, Breadcrumb
- **Feedback**: Alert, Alert Dialog, Toast, Dialog, Sheet, Popover, Tooltip
- **Data Display**: Table, Badge, Avatar, Calendar, Skeleton
- **And many more...**

#### Component Composition

While you cannot create custom UI components, you **MAY** compose shadcn/ui components together to create more complex interfaces:

```typescript
// ✅ CORRECT: Composing shadcn/ui components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WorkoutCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Workout</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Start Workout</Button>
      </CardContent>
    </Card>
  );
}
```

```typescript
// ❌ INCORRECT: Creating custom UI components
export function CustomButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="custom-styles">
      {children}
    </button>
  );
}
```

---

## Date Formatting

### date-fns - REQUIRED

**ALL date formatting MUST be done using [date-fns](https://date-fns.org/).**

#### Installation

```bash
npm install date-fns
```

#### Standard Date Format

Dates throughout the application SHALL be formatted with the following pattern:

**Format**: `{ordinal day} {short month} {full year}`

**Examples**:
- `1st Sep 2025`
- `2nd Aug 2025`
- `3rd Jan 2026`
- `4th Jun 2024`
- `21st Dec 2024`
- `22nd Nov 2025`
- `23rd Oct 2024`

#### Implementation

Use the `format` function from date-fns with a custom ordinal suffix:

```typescript
import { format } from 'date-fns';

/**
 * Get ordinal suffix for a day (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Format date in the standard project format
 * @param date - Date to format
 * @returns Formatted date string (e.g., "1st Sep 2025")
 */
export function formatDate(date: Date): string {
  const day = parseInt(format(date, 'd'), 10);
  const ordinal = getOrdinalSuffix(day);
  return `${day}${ordinal} ${format(date, 'MMM yyyy')}`;
}

// Usage
const myDate = new Date('2025-09-01');
console.log(formatDate(myDate)); // "1st Sep 2025"
```

#### Creating a Utility File

It is RECOMMENDED to create a utility file for date formatting:

**File**: `src/lib/date-utils.ts`

```typescript
import { format } from 'date-fns';

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function formatDate(date: Date): string {
  const day = parseInt(format(date, 'd'), 10);
  const ordinal = getOrdinalSuffix(day);
  return `${day}${ordinal} ${format(date, 'MMM yyyy')}`;
}
```

**Usage throughout the app**:

```typescript
import { formatDate } from '@/lib/date-utils';

const workoutDate = new Date();
const displayDate = formatDate(workoutDate); // "1st Sep 2025"
```

#### Additional Date Formatting

For other date formatting needs (time, relative dates, etc.), continue using date-fns functions:

```typescript
import { format, formatRelative, formatDistance } from 'date-fns';

// Time
format(date, 'HH:mm'); // "14:30"

// Relative
formatRelative(date, new Date()); // "last Friday at 2:30 PM"

// Distance
formatDistance(date, new Date(), { addSuffix: true }); // "2 days ago"
```

---

## Styling

### Tailwind CSS

- Use Tailwind utility classes for styling shadcn/ui components
- Follow the project's CSS variable system defined in `src/app/globals.css`
- Use shadcn/ui's built-in variant system (e.g., `variant="destructive"` for buttons)

### CSS Variables

The project uses CSS variables for theming. Refer to `src/app/globals.css` for available variables:

```css
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground
/* etc. */
```

---

## Summary

1. **Components**: ONLY shadcn/ui components - NO custom UI components
2. **Dates**: Use date-fns with the format `{day}{ordinal} {MMM} {yyyy}` (e.g., "1st Sep 2025")
3. **Styling**: Tailwind CSS with project CSS variables

---

**Failure to comply with these standards will result in code review rejections.**
