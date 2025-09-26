# User-Location Integration Plan

## Current Relationship Status
- ✅ Many-to-many relationship established via `userLocationsTable` junction table
- ✅ Backend API endpoints implemented for user-location management
- ❌ Missing database relations in `relations.ts`
- ❌ Frontend still uses mock data

## Database Relationship Structure

### Junction Table: `userLocationsTable`
```sql
user_locations {
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  locationId: uuid (FK -> locations.id, CASCADE DELETE)
  isDefault: boolean (default: false)
  createdAt: timestamp
}
```

### Key Features
- Users can be assigned to multiple locations
- Each user can have one default location per assignment
- Locations can have multiple users
- Cascade delete when location is removed
- Unique constraints prevent duplicate assignments

## Implementation Plan

### Phase 1: Complete Backend Relations ✅
1. Add user-location relations to `database/schemas/relations.ts`
2. Add location relations to users and locations tables
3. Update database schema exports

### Phase 2: Frontend API Integration
1. Create location-related API queries:
   - `useUserLocations()` - Get user's assigned locations
   - `useUserDefaultLocation()` - Get user's default location
   - `useSetDefaultLocation()` - Update user's default location

2. Update AuthContext:
   - Add location state management
   - Handle location switching
   - Integrate with existing user state

### Phase 3: Replace Mock Data
1. Update `select-location.tsx` to use real API data
2. Add loading and error states
3. Implement proper location selection flow

### Phase 4: Add Location Management
1. Create admin components for user-location assignment
2. Add user profile section for location preferences
3. Implement location-based route guards

### Phase 5: Global Location State
1. Add location context to app state
2. Implement location switching without re-auth
3. Add location display in header/navigation

## Available Backend Endpoints

### Location Management
- `POST /locations` - Create location (admin/manager)
- `GET /locations` - Get all locations with filters
- `GET /locations/active` - Get active locations
- `GET /locations/:id` - Get location by ID
- `PATCH /locations/:id` - Update location (admin/manager)
- `DELETE /locations/:id` - Delete location (admin)

### User-Location Assignment
- `GET /locations/my-locations` - Get current user's assigned locations
- `GET /locations/my-default-location` - Get current user's default location
- `POST /locations/:id/assign-user` - Assign user to location (admin/manager)
- `DELETE /locations/:id/users/:userId` - Remove user from location (admin/manager)
- `GET /locations/:id/users` - Get users assigned to location (admin/manager)

### Query Parameters for GET /locations
- `isActive` - Filter by active status
- `city` - Filter by city
- `country` - Filter by country
- `search` - Search in name, address, city
- `page` - Pagination
- `limit` - Results per page

## Frontend Integration Guide

### 1. API Queries to Create
```typescript
// src/queries/useUserLocations.ts
export const useUserLocations = () => {
  return createQuery({
    queryKey: ['user-locations'],
    queryFn: () => api.get('/locations/my-locations')
  });
};

// src/queries/useUserDefaultLocation.ts
export const useUserDefaultLocation = () => {
  return createQuery({
    queryKey: ['user-default-location'],
    queryFn: () => api.get('/locations/my-default-location')
  });
};
```

### 2. AuthContext Updates
```typescript
interface AuthContextType {
  // Existing user state
  user: DashboardUser | undefined;

  // New location state
  currentLocationId: string | null;
  userLocations: Location[];
  defaultLocation: Location | null;

  // New location methods
  setCurrentLocation: (locationId: string) => void;
  getUserLocations: () => Promise<Location[]>;
  setDefaultLocation: (locationId: string) => Promise<void>;
}
```

### 3. Route Protection
```typescript
// Check if user has access to specific location
const hasLocationAccess = (user: User, locationId: string) => {
  return user.locations?.some(loc => loc.id === locationId);
};

// Route guard component
const LocationGuard = (props: { children: any, requiredLocationId?: string }) => {
  // Implementation for location-based access control
};
```

### 4. Location Switching
```typescript
// Component for switching between user's locations
const LocationSwitcher = () => {
  const { userLocations, currentLocationId, setCurrentLocation } = useAuth();

  return (
    <select
      value={currentLocationId}
      onChange={(e) => setCurrentLocation(e.target.value)}
    >
      {userLocations.map(location => (
        <option key={location.id} value={location.id}>
          {location.name}
        </option>
      ))}
    </select>
  );
};
```

## Admin Features

### User Management
- Assign users to multiple locations
- Set default locations for users
- Remove users from locations
- View all users per location

### Location Management
- Create/edit/delete locations
- Manage location status (active/inactive)
- View location statistics and user counts

## Security Considerations

### Backend
- JWT-based authentication for all endpoints
- Role-based authorization (admin, manager, user)
- Location-specific data filtering based on user assignments
- Cascade deletes to maintain data integrity

### Frontend
- Location-based route guards
- Context-aware navigation based on permissions
- Secure storage of location preferences
- Automatic logout if location access is revoked

## Database Migrations

When implementing, ensure proper database migrations for:
1. Creating `user_locations` table
2. Adding foreign key constraints
3. Creating necessary indexes for performance
4. Setting up cascade delete relationships

## Testing Strategy

### Backend Testing
- Unit tests for all location service methods
- Integration tests for user-location assignment flow
- Authorization testing for different user roles
- Database constraint testing

### Frontend Testing
- Component tests for location selection
- Integration tests for auth context updates
- E2E tests for complete location workflow
- Permission-based access testing

## Performance Considerations

### Backend Optimizations
- Proper indexing on foreign keys
- Efficient queries with joins for user-location data
- Caching for frequently accessed location data
- Pagination for large location lists

### Frontend Optimizations
- Query caching for user locations
- Optimistic updates for location switching
- Lazy loading of location-specific data
- Debounced search for location filtering