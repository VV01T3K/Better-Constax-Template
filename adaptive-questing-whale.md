# TanStack DB Optimistic Todos Demo - Implementation Plan

## Context

The user wants to add a new demo page that showcases TanStack DB's optimistic update capabilities. The codebase already has two todos demos:
- `/demo/convex` - Pure Convex with real-time updates
- `/demo/convex-query` - Convex + TanStack Query integration

Neither of these implements optimistic updates (instant UI feedback before server confirmation). The new demo will extend the existing todos concept with TanStack DB to demonstrate:
1. **Performance benefits** - Instant UI updates vs waiting for server
2. **Visual indicators** - Clear pending/confirmed/error states
3. **Error handling & rollback** - What happens when mutations fail

This fills a gap in the demo suite by showing how to handle optimistic updates properly, which is crucial for responsive UIs.

---

## Implementation Approach

### Architecture

**Three-Layer Pattern:**
1. **TanStack DB Collection** - Local reactive state with optimistic updates
2. **Convex Backend** - Existing `/convex/todos.ts` mutations (reused)
3. **React UI** - Visual indicators for operation states

**Optimistic Update Flow:**
```
User Action (e.g., Add Todo)
    ↓
Insert into TanStack DB collection immediately (status: 'optimistic')
    ↓
Fire Convex mutation (background)
    ↓
On Success: Update collection entry (status: 'confirmed')
On Error: Remove optimistic entry + show error toast
    ↓
UI reactively updates via useLiveQuery
```

### Key Design Decisions

1. **Reuse Existing Backend**: Use the existing `api.todos.add`, `api.todos.toggle`, `api.todos.remove` mutations
2. **Dual ID Strategy**: Use temporary UUIDs for optimistic items, replace with Convex IDs on confirmation
3. **Status Field**: Add `status: 'optimistic' | 'confirmed' | 'error'` to track operation state
4. **Visual Differentiation**: Optimistic items are semi-transparent with spinner badge, confirmed items are solid

---

## Files to Create

### 1. `/workspaces/debian/src/db-collections/todos.ts`
**Purpose**: TanStack DB collection definition for todos with optimistic state

```typescript
import { createCollection, localOnlyCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

const OptimisticTodoSchema = z.object({
  id: z.string(),                    // UUID for optimistic, Convex ID for confirmed
  text: z.string(),
  completed: z.boolean(),
  status: z.enum(['optimistic', 'confirmed', 'error']),
  createdAt: z.number(),
});

export type OptimisticTodo = z.infer<typeof OptimisticTodoSchema>;

export const todosCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (todo) => todo.id,
    schema: OptimisticTodoSchema,
  })
);
```

### 2. `/workspaces/debian/src/hooks/demo.useOptimisticTodos.ts`
**Purpose**: Core hook with optimistic CRUD operations

**Key Functions:**
- `useOptimisticTodos()` - Returns all todos via `useLiveQuery`
- `useAddTodoOptimistic()` - Optimistic add with rollback
- `useToggleTodoOptimistic()` - Optimistic toggle with rollback
- `useRemoveTodoOptimistic()` - Optimistic remove with rollback
- `useSyncTodos()` - Initial sync from Convex on mount

**Pattern for each operation:**
1. Store rollback data (for update/remove)
2. Apply optimistic change to collection
3. Fire Convex mutation
4. On success: Update with confirmed state
5. On error: Rollback + show error toast

### 3. `/workspaces/debian/src/routes/demo/db-optimistic.tsx`
**Purpose**: Main demo route showcasing optimistic todos

**Layout:**
- Header card explaining the demo
- Performance comparison callout (instant vs waiting)
- Add todo input with visual feedback
- Todos list with status badges
- "Simulate Error" toggle for testing rollback

**Visual Indicators:**
- Optimistic: `opacity-60` + spinner badge + pulsing animation
- Confirmed: `opacity-100` + brief checkmark flash
- Error: Red border flash + toast notification

### 4. `/workspaces/debian/src/components/demo.status-badge.tsx`
**Purpose**: Reusable status indicator component

Shows different states:
- 🔄 "Pending..." (optimistic)
- ✓ "Saved" (confirmed, brief display)
- ❌ "Failed" (error)

---

## Files to Modify

### `/workspaces/debian/src/db-collections/index.ts`
- Export the new `todosCollection`

```typescript
export { messagesCollection } from "./index";
export { todosCollection } from "./todos";
```

---

## Implementation Details

### Optimistic Add Pattern

```typescript
export function useAddTodoOptimistic() {
  const addTodoMutation = useConvexMutation(api.todos.add);

  return useCallback(async (text: string) => {
    const tempId = crypto.randomUUID();

    // Optimistic insert
    todosCollection.insert({
      id: tempId,
      text,
      completed: false,
      status: 'optimistic',
      createdAt: Date.now(),
    });

    try {
      // Backend mutation
      const convexId = await addTodoMutation({ text });

      // Update with confirmed state and real ID
      todosCollection.update(tempId, {
        id: convexId,
        status: 'confirmed'
      });

      // Briefly show confirmed badge, then hide
      setTimeout(() => {
        todosCollection.update(convexId, { status: 'confirmed' });
      }, 2000);
    } catch (error) {
      // Rollback on error
      todosCollection.remove(tempId);
      showErrorToast('Failed to add todo');
    }
  }, [addTodoMutation]);
}
```

### Optimistic Toggle Pattern

```typescript
export function useToggleTodoOptimistic() {
  const toggleMutation = useConvexMutation(api.todos.toggle);

  return useCallback(async (id: string) => {
    const current = todosCollection.getById(id);
    if (!current) return;

    const previousCompleted = current.completed;

    // Optimistic update
    todosCollection.update(id, {
      completed: !previousCompleted,
      status: 'optimistic'
    });

    try {
      await toggleMutation({ id });
      todosCollection.update(id, { status: 'confirmed' });
    } catch (error) {
      // Rollback
      todosCollection.update(id, {
        completed: previousCompleted,
        status: 'error'
      });
      showErrorToast('Failed to toggle todo');

      // Reset error state after brief display
      setTimeout(() => {
        todosCollection.update(id, { status: 'confirmed' });
      }, 2000);
    }
  }, [toggleMutation]);
}
```

### Optimistic Remove Pattern

```typescript
export function useRemoveTodoOptimistic() {
  const removeMutation = useConvexMutation(api.todos.remove);

  return useCallback(async (id: string) => {
    const removedTodo = todosCollection.getById(id);
    if (!removedTodo) return;

    // Optimistic remove
    todosCollection.remove(id);

    try {
      await removeMutation({ id });
      // Success - item already removed
    } catch (error) {
      // Rollback - restore the item
      todosCollection.insert({
        ...removedTodo,
        status: 'error'
      });
      showErrorToast('Failed to remove todo');

      // Reset error state
      setTimeout(() => {
        todosCollection.update(id, { status: 'confirmed' });
      }, 2000);
    }
  }, [removeMutation]);
}
```

### Initial Sync Pattern

```typescript
export function useSyncTodos() {
  const { data: serverTodos } = useSuspenseQuery(
    convexQuery(api.todos.list, {})
  );

  useEffect(() => {
    // Clear collection and sync with server state on mount
    todosCollection.clear();

    for (const todo of serverTodos) {
      todosCollection.insert({
        id: todo._id,
        text: todo.text,
        completed: todo.completed,
        status: 'confirmed',
        createdAt: todo._creationTime,
      });
    }
  }, []); // Only on mount
}
```

---

## Visual Design

### Color Scheme
- Background: `linear-gradient(135deg, #f59e0b 0%, #f97316 25%, #fb923c 50%, #fbbf24 75%, #fef3c7 100%)`
- Theme: Amber/Orange (warm, energetic - represents speed/performance)
- Primary actions: Amber gradient
- Optimistic state: Amber accent with pulse
- Confirmed state: Green accent (brief)
- Error state: Red accent

### Layout

```
┌─────────────────────────────────────────────────────┐
│  TanStack DB - Optimistic Todos                     │
│  Instant UI updates with smart rollback             │
│                                                     │
│  ⚡ Performance: Updates appear instantly!          │
│     (vs waiting for server confirmation)            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [What needs to be done?          ] [Add]           │
│                                                     │
│  ☐ Buy groceries         🔄 Pending...             │
│     (opacity: 60%, pulse animation)                 │
│                                                     │
│  ☑ Read documentation    ✓                          │
│     (strikethrough, normal opacity)                 │
│                                                     │
│  ☐ Write tests          ❌ Failed [×]              │
│     (red border flash, retry option)                │
└─────────────────────────────────────────────────────┘
```

---

## Reusable Code & Patterns

### From Existing Demos

1. **Collection Pattern** (from `/src/db-collections/index.ts`):
   - `createCollection` + `localOnlyCollectionOptions`
   - Zod schema validation
   - `getKey` for unique identification

2. **Convex Integration** (from `/src/routes/demo/convex-query.tsx`):
   - `convexQuery` for data fetching
   - `useConvexMutation` for mutations
   - Route loader with `ensureQueryData`

3. **UI Patterns** (from `/src/routes/demo/convex-query.tsx`):
   - Gradient background with backdrop blur cards
   - Input + button layout with validation
   - Todo list with checkbox + text + delete button
   - Empty state messaging

4. **Mutation Pattern** (from `/convex/todos.ts`):
   - Reuse existing `add`, `toggle`, `remove` mutations
   - No backend changes needed

---

## Implementation Steps

### Phase 1: Collection Setup
1. Create `/src/db-collections/todos.ts` with schema
2. Update `/src/db-collections/index.ts` exports

### Phase 2: Hooks Layer
1. Create `/src/hooks/demo.useOptimisticTodos.ts`
2. Implement all CRUD operations with optimistic updates
3. Add error handling and rollback logic

### Phase 3: UI Components
1. Create `/src/components/demo.status-badge.tsx`
2. Implement status indicators with animations

### Phase 4: Route Integration
1. Create `/src/routes/demo/db-optimistic.tsx`
2. Wire up hooks and components
3. Add route loader for initial sync
4. Implement visual feedback system

### Phase 5: Polish
1. Add animations (pulse for pending, flash for confirmed/error)
2. Implement error toast notifications
3. Add performance comparison callout
4. Test all error scenarios and rollback behavior

---

## Testing & Verification

### Manual Test Scenarios

1. **Add Todo**
   - ✓ Item appears instantly in list
   - ✓ Shows "Pending..." badge
   - ✓ Transitions to confirmed state
   - ✓ Input clears after add

2. **Toggle Todo**
   - ✓ Checkbox state changes instantly
   - ✓ Strikethrough applies immediately
   - ✓ Shows brief pending indicator

3. **Remove Todo**
   - ✓ Item disappears instantly
   - ✓ Can be rolled back on error

4. **Error Handling** (simulate by killing Convex or adding error trigger):
   - ✓ Optimistic add rolls back
   - ✓ Optimistic toggle reverts
   - ✓ Optimistic remove restores item
   - ✓ Error toast displays
   - ✓ UI recovers gracefully

5. **Performance Comparison**:
   - ✓ Side-by-side with `/demo/convex-query`
   - ✓ Observe instant feedback vs waiting

### Edge Cases
- Empty collection state
- Rapid consecutive operations
- Network timeout scenarios
- Page refresh during pending operations (should sync from server)

---

## Critical Files

These files contain the core implementation logic:

1. **[/workspaces/debian/src/hooks/demo.useOptimisticTodos.ts](src/hooks/demo.useOptimisticTodos.ts)** - Contains all optimistic CRUD operations, error handling, and rollback logic
2. **[/workspaces/debian/src/db-collections/todos.ts](src/db-collections/todos.ts)** - TanStack DB collection definition with optimistic status schema
3. **[/workspaces/debian/src/routes/demo/db-optimistic.tsx](src/routes/demo/db-optimistic.tsx)** - Main demo route that integrates all pieces with visual feedback
4. **[/workspaces/debian/src/components/demo.status-badge.tsx](src/components/demo.status-badge.tsx)** - Status indicator component for visual state feedback

---

## Benefits of This Approach

1. **Minimal Backend Changes**: Reuses existing Convex todos mutations
2. **Clear Separation**: TanStack DB handles optimistic state, Convex handles persistence
3. **Type Safety**: Zod schemas ensure data consistency
4. **User Experience**: Instant feedback with clear status indicators
5. **Error Resilience**: Graceful rollback on failures
6. **Educational**: Shows best practices for optimistic updates in a real-world pattern

---

## Future Enhancements

1. Conflict resolution for multi-user scenarios
2. Offline queue with retry logic
3. Optimistic batch operations
4. Undo/redo functionality
5. Performance metrics display (time saved vs non-optimistic)
