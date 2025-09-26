# User Profile Screen Implementation Plan (Revised)

## Field Analysis Based on Backend Schema

### Editable Fields (User can modify):
1. **firstName** - Personal name
2. **lastName** - Personal name
3. **phoneNumber** - Contact information (optional)
4. **bio** - Personal description (optional, max 1000 chars)
5. **profilePictureUrl** - Avatar/profile picture (optional)
6. **gender** - Personal detail (optional)
7. **dateOfBirth** - Personal detail (optional)
8. **country** - Location information (optional)
9. **city** - Location information (optional)

### Read-Only Fields (Display only):
1. **email** - Used as username/login identifier (CANNOT BE EDITED)
2. **role** - Security-critical, admin-only modification
3. **isActive** - Account status, admin-only
4. **isEmailVerified** - Email verification status
5. **Assigned locations** - From user-location relationship

### Hidden Fields (Not displayed to user):
- **createdAt** - Not relevant for user
- **updatedAt** - Internal tracking
- **lastLoginAt** - Security sensitive
- **lastLogoutAt** - Security sensitive
- **deletedAt** - Internal status
- **refreshToken** - Security token
- **All token/password reset fields** - Security sensitive

### Separate Security Section:
- **Password change** - Requires current password verification

## Implementation Details

### 1. ProfileContent Component Structure

```typescript
// Profile sections:
1. Personal Information
   - First Name* (editable)
   - Last Name* (editable)
   - Email (read-only, grayed out with lock icon)
   - Phone Number (editable)
   - Date of Birth (editable, date picker)
   - Gender (editable, dropdown)

2. Professional Information
   - Role Badge (read-only, colored based on level)
   - Assigned Locations (read-only list)
   - Bio/Description (editable, textarea)

3. Location Information
   - Country (editable)
   - City (editable)

4. Account Security
   - Change Password (separate form)
   - Email Verification Status (badge)
   - Account Status (Active/Inactive badge)

5. Profile Picture
   - Upload/Change avatar (editable)
```

### 2. API Integration

**GET /auth/me** - Fetch current user data
**PATCH /users/me** - Update profile (excluding role, isActive)
  - Allowed fields: firstName, lastName, phoneNumber, bio, profilePictureUrl, gender, dateOfBirth, country, city
**POST /users/:id/change-password** - Password change with current password

### 3. Security Considerations

1. **Email as Username**:
   - Display with lock icon
   - Tooltip: "Email cannot be changed as it's your login identifier"
   - Gray background to indicate non-editable

2. **Role Display**:
   - Visual badge with color coding:
     - ADMIN: Red/Purple badge
     - MANAGER: Blue badge
     - HEAD_BAKER/HEAD_PASTRY_CHEF: Green badge
     - BAKER/PASTRY_CHEF: Yellow badge
     - CASHIER: Orange badge
     - VIEWER: Gray badge
   - Show permission level description

3. **Password Change**:
   - Separate modal/section
   - Requires current password
   - Strong password validation
   - Confirmation field

### 4. UI/UX Features

1. **Form States**:
   - Dirty state tracking (show "unsaved changes")
   - Save/Cancel buttons
   - Loading states during API calls
   - Success/Error notifications

2. **Validation**:
   - Real-time validation for phone number format
   - Bio character count (max 1000)
   - Required field indicators (firstName, lastName)

3. **Visual Hierarchy**:
   - Card-based sections
   - Clear separation between editable and read-only
   - Consistent icons and styling

### 5. Sidebar Integration

Add Profile link to sidebar menu:
- Position: After Dashboard, before Settings
- Icon: 👤
- Path: /profile
- Available to all roles (per permissions.ts)

## Summary of Key Decisions

✅ **Email NOT editable** - Used as login identifier
✅ **Hide sensitive dates** - createdAt, lastLoginAt not shown
✅ **Role read-only** - Security critical
✅ **Personal details editable** - Name, phone, bio, location
✅ **Password separate** - Requires current password
✅ **Visual role indicator** - Shows permission level clearly