# Type Consistency Fixes - History System v1.1

## 🔧 Issues Identified and Fixed

### 1. **Score Field Consistency** ✅
- **Legacy System**: `score: number` (required) - Raw number of correct answers
- **New System**: `score?: number` (optional) - Can be raw score or percentage depending on context
- **Resolution**: Maintained both systems with clear documentation of usage

### 2. **Percentage Field Missing** ✅ FIXED
- **Issue**: Legacy `SimuladoResultado` has `percentage: number` but new `ActivityHistory` didn't
- **Fix**: Added `percentage?: number` to `ActivityHistory` and related interfaces
- **Database**: Added `percentage NUMERIC(5,2)` column to `activity_history` table
- **Integration**: Updated all functions to handle percentage field

## 📋 Changes Made

### Database Schema (`supabase/migrations/20240101_012_unified_history_system.sql`)
```sql
-- Added percentage field to activity_history table
percentage NUMERIC(5,2), -- For compatibility with legacy systems (0-100)

-- Updated add_activity_to_history function
CREATE OR REPLACE FUNCTION add_activity_to_history(
    -- ... other parameters
    p_percentage NUMERIC DEFAULT NULL,
    -- ... rest of parameters
)
```

### TypeScript Types (`types/history.ts`)
```typescript
export interface ActivityHistory {
  // ... other fields
  score?: number;
  percentage?: number; // For compatibility with legacy systems (0-100)
  // ... rest of fields
}

export interface CreateActivityInput {
  // ... other fields
  score?: number;
  percentage?: number;
  // ... rest of fields
}
```

### Integration Layer (`lib/history-integration.ts`)
```typescript
// Updated trackSimulationCompletion to properly handle both fields
return this.addActivity({
  // ... other fields
  score: params.score, // Raw score (number of correct answers)
  percentage: percentage, // Calculated percentage (0-100)
  // ... rest of fields
})
```

### Hook Implementation (`hooks/use-history.ts`)
```typescript
// Updated addActivity to include percentage field
const activityData = {
  // ... other fields
  score: input.score,
  percentage: input.percentage,
  // ... rest of fields
}
```

## 🎯 Field Usage Guidelines

### Score vs Percentage
- **`score`**: Raw numeric value (e.g., 85 correct answers, mood level 7/10)
- **`percentage`**: Calculated percentage value (0-100, e.g., 85.5%)

### For Simulations
- **`score`**: Number of correct answers (e.g., 85)
- **`percentage`**: Success rate (e.g., 85.5%)
- **Both fields are populated** for full compatibility

### For Other Activities
- **`score`**: Can be any numeric metric relevant to the activity
- **`percentage`**: Optional, used when activity has a percentage-based metric

## 🔄 Migration Strategy

### Legacy Data Compatibility
1. **Existing `simulation_history`** continues to work unchanged
2. **New unified system** can store both score and percentage
3. **Migration function** converts legacy data to new format
4. **Components** can display both legacy and new data

### Type Safety
- All interfaces are now consistent
- Optional fields prevent breaking changes
- Clear documentation of field usage
- Backward compatibility maintained

## ✅ Verification Checklist

- [x] `ActivityHistory` interface includes `percentage?: number`
- [x] `CreateActivityInput` interface includes `percentage?: number`
- [x] Database schema includes `percentage` column
- [x] `add_activity_to_history` function handles percentage
- [x] `HistoryTracker.trackSimulationCompletion` sets both score and percentage
- [x] `useHistory` hook handles percentage field
- [x] Legacy `SimuladoResultado` remains unchanged (required fields)
- [x] Integration layer properly maps between systems

## 🚀 Next Steps

1. **Test the migration** to ensure no type errors
2. **Update components** to display percentage when available
3. **Add validation** for percentage values (0-100 range)
4. **Document usage patterns** for different activity types

## 📝 Notes

- **Backward Compatibility**: All existing code continues to work
- **Forward Compatibility**: New system supports richer data models
- **Type Safety**: TypeScript will catch any remaining inconsistencies
- **Performance**: Optional fields don't impact database performance
- **Flexibility**: System can evolve without breaking changes