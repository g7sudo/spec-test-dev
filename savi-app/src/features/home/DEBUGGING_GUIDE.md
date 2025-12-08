# Debugging Guide: Billboard Collapse Issue

## Changes Made

### 1. Added Comprehensive Logging
- **GreyStrip**: Logs gesture start, update, and end events
- **HomeScreen**: Logs state changes and scroll position
- **BillDrawer**: Logs prop changes and animation triggers

### 2. Fixed Critical Issues

#### Issue #1: Margin Preserving Space
**Problem:** `marginTop: 12` was static, causing 12px space even when collapsed.

**Fix:** Made `marginTop` conditional in animated style:
```typescript
marginTop: currentHeight > 0 ? 12 : 0,
```

#### Issue #2: ContentWrapper minHeight
**Problem:** `minHeight: DRAWER_HEIGHT - 32` was preventing proper collapse.

**Fix:** Removed `minHeight` from contentWrapper style.

#### Issue #3: Gesture Configuration
**Problem:** Gesture might not activate properly with ScrollView.

**Fix:** 
- Added `.enabled(isScrollAtTop)` to prevent gesture when scrolled
- Lowered `activeOffsetY` threshold from 10px to 5px
- Reduced `failOffsetX` from 50px to 30px

### 3. Added Debug UI
- Temporary test buttons to force collapse/expand
- Shows current state and scroll position
- Helps verify state changes work independently of gestures

## Validation Checklist

Run the app and check the console logs for each step:

### ✅ Check 1: Gesture Fires
**Test:** Pull up on GreyStrip when scroll is at top

**Expected Logs:**
```
[GreyStrip] Gesture started { isScrollAtTop: true, isDrawerExpanded: true }
[GreyStrip] Gesture update { translationY: -35, ... }
[GreyStrip] Gesture ended { translationY: -45, velocityY: -350, ... }
[GreyStrip] ✅ Pull UP detected - attempting collapse
[GreyStrip] 🔽 Calling onPullUp()
[HomeScreen] 🔽 handleCollapseDrawer called - setting isBillboardExpanded to false
[HomeScreen] 🎯 State changed: isBillboardExpanded = false
[BillDrawer] 📦 Received isExpanded prop: false
[BillDrawer] 🎬 Animation effect triggered, isExpanded: false
[BillDrawer] ⬇️ Collapsing to height: 0
```

**If logs don't appear:**
- Gesture might be blocked by ScrollView
- Check if `isScrollAtTop` is actually `true`
- Verify touch area is on GreyStrip

---

### ✅ Check 2: State Changes
**Test:** Use "Force Collapse" button

**Expected:**
- Button text shows `isBillboardExpanded = false ❌`
- Billboard visually disappears
- Console shows state change logs

**If state doesn't change:**
- Check React state updates
- Verify `setIsBillboardExpanded` is being called

---

### ✅ Check 3: Scroll Position Check
**Test:** Scroll down slightly, then try gesture

**Expected Logs:**
```
[HomeScreen] 📍 Scroll position: 0.5 isScrollAtTop: true
[GreyStrip] Gesture started { isScrollAtTop: true, ... }
```

**If gesture blocked:**
- Check `scrollOffset <= 1` threshold
- Verify `handleScroll` is firing
- Check if `scrollEventThrottle={16}` is working

---

### ✅ Check 4: Billboard Receives Correct Prop
**Test:** After collapse, check BillDrawer logs

**Expected:**
```
[BillDrawer] 📦 Received isExpanded prop: false
[BillDrawer] 🎬 Animation effect triggered, isExpanded: false
```

**If prop is still true:**
- State not propagating correctly
- Check parent-child prop passing

---

### ✅ Check 5: Billboard Container Collapses
**Test:** After collapse, visually inspect

**Expected:**
- Billboard height animates to 0
- No visible banner content
- No gap/margin where banner was
- GreyStrip moves up directly below header

**If still visible:**
- Check animated style values
- Verify `height.value` reaches 0
- Check for fixed heights/margins in parent containers

---

### ✅ Check 6: No Extra Wrapper Space
**Test:** Inspect layout when collapsed

**Expected:**
- `headerArea` has no extra padding/margin
- BillDrawer container has `marginTop: 0` when collapsed
- No white space between header and GreyStrip

**If space exists:**
- Check `headerArea` styles
- Verify animated `marginTop` is working
- Check for other layout wrappers

---

### ✅ Check 7: State Persistence
**Test:** Collapse, scroll down, scroll back to top

**Expected:**
- `isBillboardExpanded` remains `false`
- Billboard stays collapsed
- Can expand again with pull down gesture

**If resets:**
- Check for state resets in `useHomeData` hook
- Verify no `useEffect` resetting state
- Check navigation/focus handlers

## Common Issues & Solutions

### Issue: Gesture Never Fires
**Possible Causes:**
1. ScrollView capturing gesture
2. `isScrollAtTop` always false
3. Touch area not on GreyStrip

**Solutions:**
- Use test buttons to verify state changes work
- Check scroll position logs
- Verify GreyStrip is touchable (add background color temporarily)

### Issue: State Changes But Billboard Doesn't Collapse
**Possible Causes:**
1. Animation not running
2. Height not reaching 0
3. Margin/padding preserving space

**Solutions:**
- Check BillDrawer animation logs
- Verify `height.value` in animated style
- Check for static margins/padding

### Issue: Billboard Collapses But Space Remains
**Possible Causes:**
1. `marginTop` not animating
2. Parent container padding
3. ContentWrapper minHeight

**Solutions:**
- Verify animated `marginTop` is conditional
- Check `headerArea` styles
- Remove any `minHeight` constraints

## Next Steps

1. **Run the app** and check console logs
2. **Use test buttons** to verify state changes work
3. **Try gesture** and check which logs appear
4. **Report which check fails** (1-7) with relevant logs

## Removing Debug Code

Once issue is resolved, remove:
1. All `console.log` statements
2. Debug test buttons in HomeScreen
3. Debug UI elements

