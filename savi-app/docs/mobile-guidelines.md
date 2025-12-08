# SAVI Mobile App Development Guidelines

> **Purpose**: This document captures lessons learned and best practices to prevent repeating common mistakes during React Native development with Expo.

## Table of Contents
1. [React Navigation 7 Configuration](#react-navigation-7-configuration)
2. [Preventing Infinite Loops in Hooks](#preventing-infinite-loops-in-hooks)
3. [Zustand Store Patterns](#zustand-store-patterns)
4. [Expo Dependency Management](#expo-dependency-management)
5. [Logging and Error Tracing](#logging-and-error-tracing)
6. [TypeScript Strict Mode Patterns](#typescript-strict-mode-patterns)
7. [Common Errors and Fixes](#common-errors-and-fixes)

---

## React Navigation 7 Configuration

### Theme Configuration

**L WRONG**: Creating custom theme objects from scratch
```typescript
// This will cause: "expected dynamic type 'boolean', but had type 'string'"
const customTheme = {
  dark: false,
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    // ...
  },
  // Missing fonts configuration!
};

<NavigationContainer theme={customTheme}>
```

** CORRECT**: Always extend DefaultTheme or DarkTheme
```typescript
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

// Option 1: Use built-in themes directly
<NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>

// Option 2: Extend built-in themes if customization needed
const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF',
  },
};
```

**Why**: React Navigation 7 themes require a `fonts` property with specific structure. DefaultTheme/DarkTheme include this. Custom themes without fonts cause runtime crashes on iOS.

### Navigation Type Safety

**L WRONG**: String-based navigation
```typescript
navigation.navigate('Home');
```

** CORRECT**: Object-based navigation with params
```typescript
navigation.navigate({ name: 'Home' });
navigation.navigate({ name: 'Profile', params: { userId: '123' } });
```

---

## Preventing Infinite Loops in Hooks

### The Problem
`useCallback` with store state in dependencies can cause infinite re-renders when the callback updates state that's in its own dependencies.

**L WRONG**: Store actions in useCallback dependencies
```typescript
const { setIsReady, data } = useMyStore();

const runStartup = useCallback(async () => {
  // Do work...
  setIsReady(true); // This triggers re-render
}, [setIsReady, data]); // setIsReady changes reference -> infinite loop

useEffect(() => {
  runStartup();
}, [runStartup]);
```

** CORRECT**: Use refs for completion tracking + getState() for actions
```typescript
const hasCompletedRef = useRef(false);
const isRunningRef = useRef(false);

const data = useMyStore((s) => s.data);

const runStartup = useCallback(async (force = false) => {
  // Guard against concurrent/repeated runs
  if (isRunningRef.current) return;
  if (hasCompletedRef.current && !force) return;

  isRunningRef.current = true;

  try {
    // Do work...
    hasCompletedRef.current = true;

    // Use getState() to call actions without adding to dependencies
    useMyStore.getState().setIsReady(true);
  } finally {
    isRunningRef.current = false;
  }
}, [data]); // Only reactive state in dependencies, not actions

useEffect(() => {
  runStartup();
}, [runStartup]);

// Provide retry that resets completion
const retry = useCallback(() => {
  hasCompletedRef.current = false;
  runStartup(true);
}, [runStartup]);
```

### Key Principles
1. **Never put store actions/setters in useCallback dependencies**
2. **Use refs to track completion state** (doesn't trigger re-renders)
3. **Use `getState()` to access store actions inside callbacks**
4. **Add guards at the start of callbacks** to prevent concurrent execution

---

## Zustand Store Patterns

### Accessing Store Actions in Callbacks

**L WRONG**: Destructuring actions from hooks
```typescript
const { setUser, setToken } = useAuthStore();

const handleLogin = useCallback(async () => {
  const result = await login();
  setUser(result.user);
  setToken(result.token);
}, [setUser, setToken]); // These are new references each render!
```

** CORRECT**: Use getState() for actions
```typescript
const handleLogin = useCallback(async () => {
  const result = await login();
  useAuthStore.getState().setUser(result.user);
  useAuthStore.getState().setToken(result.token);
}, []); // No dependencies on store actions
```

### Subscribing to Specific State

** CORRECT**: Use selectors to minimize re-renders
```typescript
// Only re-render when isAuthenticated changes
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

// NOT this - re-renders on ANY store change
const store = useAuthStore();
```

### Context Providers with Zustand

**❌ WRONG**: Destructuring store actions in Context Providers
```typescript
// ThemeProvider.tsx
const ThemeProvider = ({ children }) => {
  const { themeMode, setThemeMode } = useAppStore(); // setThemeMode is new ref every render!

  const value = useMemo(() => ({
    themeMode,
    setThemeMode, // This changes every render -> infinite loop
  }), [themeMode, setThemeMode]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};
```

**✅ CORRECT**: Selectors + stable action references
```typescript
const ThemeProvider = ({ children }) => {
  const themeMode = useAppStore((s) => s.themeMode); // Selector - stable!

  // Stable reference with useCallback + getState()
  const setThemeMode = useCallback((mode) => {
    useAppStore.getState().setThemeMode(mode);
  }, []);

  const value = useMemo(() => ({
    themeMode,
    setThemeMode,
  }), [themeMode, setThemeMode]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};
```

### Hydration Status Tracking

```typescript
// In store definition
export const useAuthHasHydrated = () => {
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onHydrate(() => setHydrated(false));
    const unsubFinish = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return () => {
      unsubscribe();
      unsubFinish();
    };
  }, []);

  return hydrated;
};
```

---

## Expo Dependency Management

### Always Use expo-doctor

Before debugging strange runtime errors, run:
```bash
npx expo-doctor@latest
```

This will identify:
- Version mismatches between packages
- Missing peer dependencies
- Incompatible package versions for your Expo SDK

### Fixing Version Mismatches

**L WRONG**: Manual npm install
```bash
npm install react-native-gesture-handler@latest
```

** CORRECT**: Use expo install
```bash
npx expo install react-native-gesture-handler
```

`npx expo install` automatically selects the correct version for your Expo SDK.

### Common Dependency Issues

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing @react-native/virtualized-lists" | Version mismatch | `npx expo install --fix` |
| "Cannot find module" | Missing transitive dep | `npx expo-doctor@latest` then fix |
| Metro bundler crashes | Incompatible versions | Clear cache: `npx expo start -c` |

---

## Logging and Error Tracing

### Setup with react-native-logs

```typescript
// src/core/logger/index.ts
import { logger, consoleTransport } from 'react-native-logs';

const config = {
  severity: __DEV__ ? 'debug' : 'info',
  transport: consoleTransport,
  transportOptions: {
    colors: {
      debug: 'white' as const,
      info: 'blueBright' as const,
      warn: 'yellowBright' as const,
      error: 'redBright' as const,
    },
  },
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  async: true,
  dateFormat: 'time' as const,
  printLevel: true,
  printDate: true,
  enabled: true,
};

const log = logger.createLogger(config);

// Create namespaced loggers
export const appLogger = log.extend('app');
export const navLogger = log.extend('nav');
export const authLogger = log.extend('auth');
export const apiLogger = log.extend('api');

// Error helper
export const logError = (context: string, error: unknown): void => {
  if (error instanceof Error) {
    appLogger.error(`[${context}] ${error.message}`, {
      stack: error.stack,
      name: error.name,
    });
  } else {
    appLogger.error(`[${context}]`, error);
  }
};
```

### Global Error Handling

```typescript
// In App.tsx
useEffect(() => {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logError('UncaughtJS', error);
    originalHandler(error, isFatal);
  });
}, []);
```

### Where to Log

| Location | Logger | Level | Example |
|----------|--------|-------|---------|
| Navigation | navLogger | debug | Screen changes |
| API calls | apiLogger | debug/error | Request/response |
| Authentication | authLogger | info | Login/logout |
| Startup | appLogger | info | Initialization steps |
| Errors | logError | error | Caught exceptions |

---

## TypeScript Strict Mode Patterns

### Style Arrays

**L WRONG**: Direct style arrays with conditional styles
```typescript
<View style={[styles.container, isActive && styles.active]}>
```

** CORRECT**: Cast to any or use StyleSheet.flatten
```typescript
<View style={[styles.container, isActive && styles.active] as any}>
// OR
<View style={StyleSheet.flatten([styles.container, isActive && styles.active])}>
```

### LinearGradient Colors

**L WRONG**: String array
```typescript
<LinearGradient colors={['#FF0000', '#00FF00']}>
```

** CORRECT**: Cast to expected type
```typescript
<LinearGradient colors={['#FF0000', '#00FF00'] as const}>
```

### Navigation Params

** CORRECT**: Define all param types
```typescript
// types.ts
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: { section?: string };
};

// Usage with proper typing
type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;
const ProfileScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params; // Typed!
};
```

### DimensionValue for Widths

```typescript
// For dynamic widths in Skeleton/loading components
import { DimensionValue } from 'react-native';

interface Props {
  width?: DimensionValue; // Accepts number, string ('50%'), etc.
}
```

---

## Common Errors and Fixes

### "Maximum update depth exceeded"

**Cause**: Infinite re-render loop, usually from:
- Store actions in useCallback dependencies
- State updates that trigger the same effect

**Fix**: See [Preventing Infinite Loops](#preventing-infinite-loops-in-hooks)

### "expected dynamic type 'boolean', but had type 'string'"

**Cause**: React Navigation theme missing `fonts` property

**Fix**: Extend DefaultTheme/DarkTheme instead of creating custom theme

### "Network Error" on startup

**Cause**: API calls in dev mode to non-existent backend

**Fix**: Skip API calls in development:
```typescript
if (__DEV__) {
  return { type: 'none', data: null };
}
```

### "Cannot find module '@react-native/virtualized-lists'"

**Cause**: Expo/RN version mismatch

**Fix**:
```bash
npx expo-doctor@latest
npx expo install --fix
```

### "Open up App.tsx to start working on your app!"

**Cause**: Root App.tsx not connected to actual app

**Fix**: Re-export from src:
```typescript
// App.tsx (root)
export { default } from './src/app/App';
```

### Metro bundler port conflict

**Fix**:
```bash
pkill -f "expo"
pkill -f "metro"
npx expo start -c
```

---

## Pre-Development Checklist

Before starting development:

- [ ] Run `npx expo-doctor@latest` to verify dependencies
- [ ] Ensure logging is set up (react-native-logs)
- [ ] Verify navigation themes extend DefaultTheme/DarkTheme
- [ ] Check Zustand stores use getState() for actions in callbacks
- [ ] Confirm startup hooks have completion refs to prevent loops

## Debugging Checklist

When encountering errors:

1. **Read the full error message** - Don't guess based on partial info
2. **Check expo-doctor** - `npx expo-doctor@latest`
3. **Check logs** - Look for the actual error source
4. **Clear cache** - `npx expo start -c`
5. **Check recent changes** - What was modified since it last worked?

---

*Last updated: December 2024*
*Based on: Expo SDK 54, React Navigation 7, Zustand 5*
