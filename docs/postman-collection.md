# BakeWind API Postman Collection

This document describes the Postman collection for the BakeWind API.

## Collection Location

The Postman collection is located at:
```
/api/postman/bakewind-api.postman_collection.json
```

## How to Import

1. Open Postman
2. Click **Import** button in the top left
3. Select the `api/postman/bakewind-api.postman_collection.json` file
4. The collection will be imported with all endpoints organized by module

## Collection Structure

The collection is organized into the following modules:

### 🔐 Authentication
- Login
- Trial Signup
- Register
- Refresh Token
- Logout
- Get Current User

### 📦 Inventory (CRUD + Consumption Tracking)
- List All Inventory Items
- List Low Stock Items
- Filter by Category
- Get Inventory Item
- Create Inventory Item
- Update Inventory Item
- Delete Inventory Item
- Get Consumption Tracking
- Set Custom Threshold
- Remove Custom Threshold
- Recalculate Consumption

### 👥 Users
- List All Users
- Get Current User Profile
- Get User by ID
- Update Current User
- Update User by ID
- Toggle User Status
- Change Password
- Delete User

### 📍 Locations
- Create Location
- List All Locations
- List Active Locations
- Get My Locations
- Get My Default Location
- Get Location by ID
- Update Location
- Delete Location
- Assign User to Location
- Remove User from Location
- Get Location Users

### 🏢 Customers
- List All Customers
- Get Customer by ID
- Create Customer
- Update Customer
- Delete Customer
- Get Customer Orders
- Get Customer Analytics
- Import Customers
- Export Customers to CSV

### 🎯 Trials
- Update Trial Onboarding
- Get Trial by ID
- Get Trial by User ID
- Convert Trial to Subscription
- List All Trials
- Get Trial Analytics
- Get Onboarding Progress
- Bulk Update Trials

### 💳 Subscriptions
- Get All Plans
- Get Popular Plans
- Compare Plans
- Get Plan by ID
- Create Plan
- Update Plan
- Activate Plan
- Deactivate Plan
- Mark Plan as Popular
- Reorder Plans

### ❤️ Health
- Health Check
- WebSocket Health Check

## Environment Variables

The collection uses the following variables (set these in your Postman environment):

| Variable | Default Value | Description |
|----------|--------------|-------------|
| `baseUrl` | `http://localhost:5000` | API base URL |
| `apiVersion` | `v1` | API version |
| `accessToken` | (empty) | JWT access token (auto-populated on login) |
| `userId` | (empty) | User ID for testing |
| `itemId` | (empty) | Inventory item ID for testing |
| `customerId` | (empty) | Customer ID for testing |
| `locationId` | (empty) | Location ID for testing |
| `trialId` | (empty) | Trial ID for testing |

## Authentication

**Important:** This API uses **httpOnly cookies** for authentication, not Bearer tokens in headers.

### How Authentication Works

1. Login via the `POST /auth/login` endpoint
2. The API sets `access_token` and `refresh_token` as httpOnly cookies
3. Postman automatically sends these cookies with subsequent requests
4. When the access token expires, use `POST /auth/refresh` to get a new one
5. The `Bearer` auth in the collection is set for documentation purposes but cookies take precedence

### Testing Authentication

```javascript
// In Postman Tests tab for Login request:
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    // Cookies are automatically stored by Postman
});
```

## Quick Start

1. **Import the collection** from `/api/postman/bakewind-api.postman_collection.json`
2. **Set up environment variables** in Postman
3. **Login first**: Execute the `Authentication > Login` request with valid credentials
   ```json
   {
     "email": "admin@bakewind.com",
     "password": "password123"
   }
   ```
4. **Test other endpoints**: All subsequent requests will use the cookies from login

## Example Workflows

### Testing Inventory Management

1. `Authentication > Login`
2. `Inventory > List All Inventory Items`
3. `Inventory > Create Inventory Item` (note the returned `id`)
4. Set `itemId` variable to the returned ID
5. `Inventory > Get Inventory Item`
6. `Inventory > Update Inventory Item`
7. `Inventory > Get Consumption Tracking`
8. `Inventory > Delete Inventory Item`

### Testing Customer Management

1. `Authentication > Login`
2. `Customers > Create Customer` (note the returned `id`)
3. Set `customerId` variable
4. `Customers > Get Customer by ID`
5. `Customers > Get Customer Orders`
6. `Customers > Get Customer Analytics`

## Updating This Collection

**IMPORTANT:** Keep this collection updated as the API evolves!

### When to Update

- ✅ New endpoints are added
- ✅ Existing endpoints are modified (request/response format)
- ✅ New query parameters are added
- ✅ Authentication method changes
- ✅ New modules are implemented

### How to Update

1. Open the collection in Postman
2. Make your changes (add/edit/delete requests)
3. Export the collection: **Right-click collection > Export**
4. Choose **Collection v2.1** format
5. Save to `/api/postman/bakewind-api.postman_collection.json`
6. Update this documentation if needed
7. Commit changes to git

### Export Settings

When exporting from Postman:
- Format: **Collection v2.1**
- ✅ Include folder structure
- ✅ Include example responses (optional)
- ✅ Include collection variables

## API Endpoint Examples

### Inventory CRUD Operations

**Create Inventory Item**
```http
POST /api/v1/inventory
Content-Type: application/json

{
  "name": "Organic Whole Wheat Flour",
  "category": "ingredient",
  "unit": "kg",
  "currentStock": 200,
  "minimumStock": 50,
  "reorderPoint": 75,
  "reorderQuantity": 150,
  "costPerUnit": 2.50,
  "supplier": "Organic Grains Co.",
  "location": "Storage Room B",
  "notes": "Premium organic flour"
}
```

**Update Inventory Item**
```http
PUT /api/v1/inventory/:itemId
Content-Type: application/json

{
  "currentStock": 175.5,
  "costPerUnit": 1.35,
  "notes": "Updated stock level"
}
```

**List Low Stock Items**
```http
GET /api/v1/inventory?low_stock_only=true
```

**Set Custom Reorder Threshold**
```http
PUT /api/v1/inventory/:itemId/consumption/threshold
Content-Type: application/json

{
  "custom_reorder_threshold": 100,
  "custom_lead_time_days": 5
}
```

## Response Examples

### Successful Inventory Item Response
```json
{
  "id": "3a67e886-cfb8-4dce-bbb3-d32bd590f3bd",
  "name": "All-Purpose Flour",
  "category": "ingredient",
  "unit": "kg",
  "currentStock": 150.5,
  "minimumStock": 50,
  "reorderPoint": 75,
  "reorderQuantity": 100,
  "costPerUnit": 1.25,
  "supplier": "King Arthur Flour Co.",
  "location": "Storage Room A",
  "notes": "Store in cool, dry place",
  "expirationDate": null,
  "lastRestocked": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Consumption Tracking Response
```json
{
  "id": "7c5d3e9f-8a7b-4c6d-9e8f-7a6b5c4d3e2f",
  "inventory_item_id": "3a67e886-cfb8-4dce-bbb3-d32bd590f3bd",
  "avg_daily_consumption": 12.5,
  "calculation_period_days": 7,
  "last_calculated_at": "2024-01-20T00:00:00.000Z",
  "calculation_method": "historical_orders",
  "custom_reorder_threshold": null,
  "custom_lead_time_days": null,
  "sample_size": 42,
  "days_of_supply_remaining": 12.04,
  "predicted_stockout_date": "2024-02-01"
}
```

## Tips

- **Use variables** for IDs instead of hardcoding them
- **Save examples** for successful responses
- **Add descriptions** to complex requests
- **Group related requests** in folders
- **Keep authentication at the top** for easy access
- **Test in order**: Some operations depend on others (e.g., create before update)

## Troubleshooting

### 401 Unauthorized
- Make sure you've logged in first
- Check that cookies are enabled in Postman
- Try refreshing the token with `POST /auth/refresh`

### 404 Not Found
- Verify the `itemId` or other ID variables are set correctly
- Check that the resource exists (use GET list endpoints)

### 400 Bad Request
- Review the request body format
- Check required fields are present
- Validate data types (numbers vs strings)

## Additional Resources

- **Swagger UI**: http://localhost:5000/api
- **API Source Code**: `/api/src/`
- **Database Seeds**: `/api/src/database/seeds/`

## Version History

- **v1.0.0** (2024-01-20) - Initial collection with Authentication, Inventory, Users, Locations, Customers, Trials, Subscriptions, and Health modules
