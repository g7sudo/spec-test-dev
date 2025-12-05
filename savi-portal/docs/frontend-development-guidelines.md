# Frontend Development Guidelines

## Table of Contents
1. [React Strict Mode & Double API Calls](#1-react-strict-mode--double-api-calls)
2. [Data Fetching Patterns](#2-data-fetching-patterns)
3. [useEffect Best Practices](#3-useeffect-best-practices)
4. [Common Anti-patterns to Avoid](#4-common-anti-patterns-to-avoid)

---

## 1. React Strict Mode & Double API Calls

### The Problem

Next.js enables React Strict Mode by default in development. This causes:
- `useEffect` hooks to run **TWICE** on mount
- Components to mount → unmount → remount
- API calls to fire multiple times

This is **intentional** to help catch bugs, but we must guard against it.

### The Solution: useRef Guard Pattern

**ALWAYS use a `useRef` guard for data-fetching `useEffect` hooks.**

```tsx
// ✅ CORRECT: Single ref for single fetch
const fetchedRef = useRef(false);

const fetchData = useCallback(async (force = false) => {
  // Guard against double fetch in Strict Mode
  if (!force && fetchedRef.current) return;
  fetchedRef.current = true;

  try {
    const data = await apiCall();
    setData(data);
  } catch (err) {
    console.error('Fetch failed:', err);
    fetchedRef.current = false; // Allow retry on error
  }
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### Multiple Independent Fetches

**Each independent fetch needs its OWN guard ref:**

```tsx
// ✅ CORRECT: Separate refs for separate fetches
const dataFetchedRef = useRef(false);
const filtersFetchedRef = useRef(false);

const fetchData = useCallback(async (force = false) => {
  if (!force && dataFetchedRef.current) return;
  dataFetchedRef.current = true;
  // ... fetch logic
}, []);

const fetchFilters = useCallback(async (force = false) => {
  if (!force && filtersFetchedRef.current) return;
  filtersFetchedRef.current = true;
  // ... fetch logic
}, []);

// Initial load - both run once
useEffect(() => {
  fetchFilters();
}, [fetchFilters]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

```tsx
// ❌ WRONG: Sharing one ref for multiple independent fetches
const fetchedRef = useRef(false); // One ref for two different fetches!

const fetchData = useCallback(async () => {
  if (fetchedRef.current) return;
  fetchedRef.current = true;
  // ...
}, []);

const fetchFilters = useCallback(async () => {
  // BUG: This may never run if fetchData ran first
  if (fetchedRef.current) return;
  fetchedRef.current = true;
  // ...
}, []);
```

---

## 2. Data Fetching Patterns

### Pattern A: Simple Initial Fetch

Use when you need to load data once on mount:

```tsx
export function MyComponent() {
  const [data, setData] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    try {
      const result = await api.getData();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch:', err);
      fetchedRef.current = false; // Allow retry
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Expose manual refresh
  const refresh = () => fetchData(true);

  return /* ... */;
}
```

### Pattern B: Fetch on Dependency Change

Use when data depends on filters, pagination, or route params:

```tsx
export function MyComponent() {
  const [data, setData] = useState<DataType[]>([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      const result = await api.getData({ page, filter });
      setData(result.items);
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
  }, [page, filter]); // Dependencies that trigger refetch

  // Track previous deps to detect ACTUAL changes (not Strict Mode re-runs)
  const prevDepsRef = useRef({ page, filter });
  
  useEffect(() => {
    const prev = prevDepsRef.current;
    const changed = prev.page !== page || prev.filter !== filter;
    
    if (changed) {
      fetchedRef.current = false; // Reset ONLY on actual change
      prevDepsRef.current = { page, filter };
    }
  }, [page, filter]);

  // Fetch effect - guard prevents Strict Mode double call
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return /* ... */;
}
```

### Pattern C: Multiple Parallel Fetches

Use when loading multiple independent datasets:

```tsx
export function MyComponent() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);

  // Separate refs for each independent fetch
  const unitsFetchedRef = useRef(false);
  const filtersFetchedRef = useRef(false);

  // Filters load once (no dependencies)
  const loadFilters = useCallback(async (force = false) => {
    if (!force && filtersFetchedRef.current) return;
    filtersFetchedRef.current = true;

    try {
      const [blocksResult, floorsResult] = await Promise.all([
        api.listBlocks({ pageSize: 100 }),
        api.listFloors({ pageSize: 100 }),
      ]);
      setBlocks(blocksResult.items);
      setFloors(floorsResult.items);
    } catch (err) {
      console.error('Failed to load filters:', err);
      filtersFetchedRef.current = false;
    }
  }, []);

  // Units depend on filters
  const fetchUnits = useCallback(async (force = false) => {
    if (!force && unitsFetchedRef.current) return;
    unitsFetchedRef.current = true;

    try {
      const result = await api.listUnits({ page, blockId, floorId });
      setUnits(result.items);
    } catch (err) {
      console.error('Failed to fetch units:', err);
    }
  }, [page, blockId, floorId]);

  // Initial load - filters (once)
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Units load when filters change
  useEffect(() => {
    unitsFetchedRef.current = false;
    fetchUnits();
  }, [fetchUnits]);

  return /* ... */;
}
```

---

## 3. useEffect Best Practices

### DO ✅

1. **Always use a guard ref for API calls**
   ```tsx
   const fetchedRef = useRef(false);
   ```

2. **Reset guard when dependencies change**
   ```tsx
   useEffect(() => {
     fetchedRef.current = false;
     fetchData();
   }, [fetchData]);
   ```

3. **Allow force refresh via parameter**
   ```tsx
   const fetchData = async (force = false) => {
     if (!force && fetchedRef.current) return;
     // ...
   };
   ```

4. **Reset guard on fetch error** (to allow retry)
   ```tsx
   catch (err) {
     fetchedRef.current = false;
   }
   ```

5. **Use separate refs for independent fetches**
   ```tsx
   const dataRef = useRef(false);
   const filtersRef = useRef(false);
   ```

### DON'T ❌

1. **Don't fetch without a guard**
   ```tsx
   // ❌ Will cause double fetch in dev
   useEffect(() => {
     fetchData();
   }, []);
   ```

2. **Don't share refs between independent fetches**
   ```tsx
   // ❌ One fetch may block the other
   const sharedRef = useRef(false);
   ```

3. **Don't reset ref inside the same useEffect that calls fetch**
   ```tsx
   // ❌ Resets EVERY time including Strict Mode re-runs = double fetch!
   useEffect(() => {
     fetchedRef.current = false; // BAD: resets on Strict Mode too
     fetchData();
   }, [fetchData]);
   ```

4. **Don't use state to track "fetched"**
   ```tsx
   // ❌ State updates cause re-renders, refs don't
   const [hasFetched, setHasFetched] = useState(false);
   ```

---

## 4. Common Anti-patterns to Avoid

### Anti-pattern 1: No Guard

```tsx
// ❌ WRONG: Double fetch in Strict Mode
useEffect(() => {
  const loadData = async () => {
    const data = await api.getData();
    setData(data);
  };
  loadData();
}, []);
```

**Fix:**
```tsx
// ✅ CORRECT
const fetchedRef = useRef(false);

useEffect(() => {
  if (fetchedRef.current) return;
  fetchedRef.current = true;
  
  const loadData = async () => {
    const data = await api.getData();
    setData(data);
  };
  loadData();
}, []);
```

### Anti-pattern 2: Guard Inside useCallback Not Checked

```tsx
// ❌ WRONG: Guard is set but never checked properly
const fetchData = useCallback(async () => {
  fetchedRef.current = true; // Sets but never checks!
  const data = await api.getData();
  setData(data);
}, []);
```

**Fix:**
```tsx
// ✅ CORRECT: Check before setting
const fetchData = useCallback(async (force = false) => {
  if (!force && fetchedRef.current) return;
  fetchedRef.current = true;
  // ...
}, []);
```

### Anti-pattern 3: Inline Async in useEffect

```tsx
// ❌ WRONG: Hard to add guards, hard to test
useEffect(() => {
  (async () => {
    const data = await api.getData();
    setData(data);
  })();
}, []);
```

**Fix:**
```tsx
// ✅ CORRECT: Extract to named function
const fetchData = useCallback(async (force = false) => {
  if (!force && fetchedRef.current) return;
  fetchedRef.current = true;
  
  const data = await api.getData();
  setData(data);
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

## Quick Reference Checklist

Before submitting code that fetches data:

- [ ] Each fetch has its own `useRef(false)` guard
- [ ] Guard is checked at the start of fetch function
- [ ] Guard is set to `true` after check passes
- [ ] Guard reset is in a SEPARATE useEffect from the fetch call (for dep changes)
- [ ] Guard is reset to `false` on fetch error (for retry)
- [ ] Force refresh is supported via `fetch(true)` parameter
- [ ] No shared refs between independent fetches
- [ ] NEVER reset guard inside the same useEffect that calls fetch

---

## Summary

### Pattern A: Simple Initial Fetch (no changing dependencies)
```tsx
const fetchedRef = useRef(false);

const fetchData = useCallback(async (force = false) => {
  if (!force && fetchedRef.current) return;
  fetchedRef.current = true;
  // ... fetch logic
}, []); // No deps = runs once

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### Pattern B: Fetch with Dependencies (filters, pagination)
```tsx
const fetchedRef = useRef(false);
const prevDepsRef = useRef({ page, filter });

const fetchData = useCallback(async (force = false) => {
  if (!force && fetchedRef.current) return;
  fetchedRef.current = true;
  // ... fetch logic using page, filter
}, [page, filter]);

// Reset guard ONLY when deps actually change (separate effect)
useEffect(() => {
  const prev = prevDepsRef.current;
  if (prev.page !== page || prev.filter !== filter) {
    fetchedRef.current = false;
    prevDepsRef.current = { page, filter };
  }
}, [page, filter]);

// Fetch effect
useEffect(() => {
  fetchData();
}, [fetchData]);
```

**KEY RULE**: Never reset `fetchedRef.current = false` inside the same useEffect that calls `fetchData()` - this defeats the Strict Mode guard!

