# Feature Specification: Dashboard Routes Migration from SolidStart to Solid.js SPA

**Feature Branch**: `003-migrate-the-old`
**Created**: 2025-09-30
**Status**: Draft
**Input**: User description: "migrate the old bakewind-front-solidstart dashboard routes into the new solidjs spa admin project, reproduce structure and styles, integrate with current status of the api and the login implementation in the website project"

## Execution Flow (main)
```
1. Parse user description from Input
   → Migrate dashboard routes from SSR app to SPA
2. Extract key concepts from description
   → Actors: Admin users, authenticated bakery staff
   → Actions: View dashboard, manage orders, track inventory, handle production, analyze data
   → Data: Orders, inventory, recipes, products, customers, analytics
   → Constraints: Must integrate with existing API and authentication flow
3. For each unclear aspect:
   → Layout preferences: Should dashboard widgets be customizable? [CLARIFIED: Yes, retain widget system]
   → Real-time updates: Do dashboard metrics need live updates? [CLARIFIED: Real-time via WebSockets/SSE]
4. Fill User Scenarios & Testing section
   → User flow is clear: authenticated user accesses dashboard features
5. Generate Functional Requirements
   → All requirements are testable
6. Identify Key Entities
   → Orders, Inventory, Recipes, Products, Customers, Production, Analytics
7. Run Review Checklist
   → No implementation details in requirements
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-09-30
- Q: Do dashboard metrics on the Overview page need to update automatically without manual refresh? → A: Real-time updates via WebSockets/SSE when data changes
- Q: How should the system handle when two bakery staff members update the same order status simultaneously? → A: Lock order when someone is editing it
- Q: When dashboard metrics update in real-time (FR-016a), what happens if the WebSocket/SSE connection drops during an active session? → A: Automatically attempt reconnection with exponential backoff and show connection status
- Q: What maximum number of dashboard widgets should the system support per user on the Overview page? → A: 20 widgets
- Q: When the system displays "low stock items with visual indicators" (FR-028), what inventory threshold defines "low stock"? → A: Predictive based on consumption rate and lead time, with user-configurable overrides per item

---

## User Scenarios & Testing

### Primary User Story
As an authenticated bakery manager, I want to access a comprehensive dashboard with multiple management sections (overview, orders, inventory, recipes, production, customers, analytics, products, profile, settings) so that I can efficiently manage all aspects of my bakery operations from a centralized interface.

### Acceptance Scenarios

1. **Given** a user is authenticated via the website login system, **When** they access the admin dashboard, **Then** they should see a sidebar navigation with all available management sections and be directed to the overview page by default.

2. **Given** a user is on the dashboard, **When** they click on any navigation item (Orders, Inventory, etc.), **Then** the corresponding page should load with appropriate data fetched from the backend without requiring re-authentication.

3. **Given** a user is viewing the Overview page, **When** the page loads, **Then** they should see a customizable dashboard with widgets displaying key bakery metrics in their preferred layout (grid, list, or masonry).

4. **Given** a user is viewing the Orders page, **When** they search or filter orders by status, **Then** the system should display matching orders with all relevant details (customer info, items, status, pricing).

5. **Given** a user clicks on an order card, **When** the order modal opens, **Then** they should see complete order details and be able to update the order status according to the workflow (pending → confirmed → in production → ready → delivered).

6. **Given** a user is viewing any dashboard section, **When** they toggle between light and dark themes, **Then** all visual elements should immediately reflect the selected theme with consistent styling.

7. **Given** a user collapses/expands the sidebar, **When** the transition completes, **Then** the content area should adjust appropriately and the user's preference should be persisted.

8. **Given** a user is viewing the dashboard on a mobile device, **When** they tap the menu button, **Then** the sidebar should open as a mobile overlay and close after navigation selection.

### Edge Cases
- What happens when backend requests fail or return no data? System should display appropriate empty states and error messages without breaking the UI.
- How does the system handle expired authentication tokens? System should detect invalid tokens and redirect to the website login page.
- What happens when a user tries to access a dashboard route directly without authentication? The protected route wrapper should catch this and redirect to login.
- How does the dashboard handle concurrent order status updates? System must lock the order when one user opens it for editing, preventing simultaneous modifications. Other users should see a locked indicator showing who is currently editing.
- What happens when the user's browser doesn't support required CSS features? System should degrade gracefully with fallback styles.
- What happens when the real-time connection (WebSocket/SSE) drops during an active session? System must automatically attempt reconnection using exponential backoff strategy (retry intervals: 2s, 4s, 8s, 16s...) and display a connection status indicator to inform users whether updates are active, reconnecting, or disconnected.

---

## Requirements

### Functional Requirements

#### Navigation & Layout
- **FR-001**: System MUST provide a collapsible sidebar navigation with sections for Overview, Orders, Inventory, Recipes, Products, Production, Customers, Analytics, Profile, and Settings.
- **FR-002**: System MUST persist the sidebar collapsed/expanded state across sessions using browser storage.
- **FR-003**: System MUST provide a mobile-responsive navigation that displays as an overlay menu on small screens.
- **FR-004**: System MUST display the authenticated user's information (name, email, avatar) in the sidebar with a dropdown menu for user actions.
- **FR-005**: System MUST allow users to toggle between light and dark themes with immediate visual feedback.
- **FR-006**: System MUST persist the selected theme preference across sessions.

#### Authentication Integration
- **FR-007**: System MUST integrate with the existing authentication flow where users log in via the website app and are redirected to the admin dashboard with authentication credentials.
- **FR-008**: System MUST validate authentication status before rendering any dashboard content.
- **FR-009**: System MUST redirect unauthenticated users to the website login page.
- **FR-010**: System MUST handle authentication refresh automatically when credentials expire during active sessions.
- **FR-011**: System MUST provide a logout function that clears authentication state and redirects to the website login page.

#### Overview/Dashboard Page
- **FR-012**: System MUST display a customizable overview page with dashboard widgets showing key bakery metrics.
- **FR-013**: System MUST allow users to switch between grid, list, and masonry layouts for dashboard widgets.
- **FR-014**: System MUST allow users to add, remove, and reorder dashboard widgets up to a maximum of 20 widgets per user.
- **FR-015**: System MUST persist the dashboard layout configuration per user.
- **FR-016**: System MUST provide widgets for: bakery metrics, recent orders, inventory alerts, production status, and user preferences.
- **FR-016a**: System MUST update dashboard metrics in real-time using WebSocket or Server-Sent Events connections when underlying data changes on the server.
- **FR-016b**: System MUST automatically attempt to reconnect using exponential backoff (e.g., retry intervals: 2s, 4s, 8s, 16s...) when the real-time connection drops.
- **FR-016c**: System MUST display a visible connection status indicator showing whether real-time updates are active, reconnecting, or disconnected.

#### Orders Management
- **FR-017**: System MUST display all orders with customer information, order items, status, pricing, and timestamps.
- **FR-018**: System MUST allow filtering orders by status (pending, confirmed, in production, ready, delivered, cancelled).
- **FR-019**: System MUST provide a search function to find orders by customer name, order number, phone, or email.
- **FR-020**: System MUST display order status with color-coded badges for visual recognition.
- **FR-021**: System MUST allow users to update order status through the workflow: pending → confirmed → in production → ready → delivered.
- **FR-022**: System MUST display order details in a modal when an order card is clicked.
- **FR-022a**: System MUST lock an order when a user opens it for editing to prevent concurrent modifications.
- **FR-022b**: System MUST display a locked indicator showing which user is currently editing an order.
- **FR-022c**: System MUST automatically release the order lock when the user closes the order modal or their session ends.
- **FR-023**: System MUST show order items with quantities, product names, and pricing.
- **FR-024**: System MUST indicate delivery/pickup times for each order.
- **FR-025**: System MUST display special requests or notes associated with orders.

#### Inventory Management
- **FR-026**: System MUST display current inventory levels for all bakery ingredients and supplies.
- **FR-027**: System MUST allow users to view inventory by categories or search for specific items.
- **FR-028**: System MUST highlight low stock items with visual indicators based on predictive thresholds calculated from average consumption rate and lead time (e.g., less than 3 days of supply remaining).
- **FR-028a**: System MUST allow users to configure custom reorder point thresholds per inventory item that override the predictive calculation.
- **FR-029**: System MUST allow users to update inventory quantities.

#### Recipes Management
- **FR-030**: System MUST display all recipes with ingredients, quantities, and preparation instructions.
- **FR-031**: System MUST allow users to search and filter recipes.
- **FR-032**: System MUST show recipe categories and tags.
- **FR-033**: System MUST display ingredient costs and recipe profitability metrics.

#### Products Management
- **FR-034**: System MUST display all bakery products with names, descriptions, pricing, and categories.
- **FR-035**: System MUST allow users to view product details including associated recipes.
- **FR-036**: System MUST show product availability status.

#### Production Management
- **FR-037**: System MUST display production schedules and batch planning information.
- **FR-038**: System MUST show which recipes are currently in production.
- **FR-039**: System MUST display production priorities based on order requirements.

#### Customers Management
- **FR-040**: System MUST display customer information including contact details and order history.
- **FR-041**: System MUST allow searching and filtering customers.
- **FR-042**: System MUST show customer lifetime value and ordering patterns.

#### Analytics
- **FR-043**: System MUST display business analytics including sales trends, popular products, and revenue metrics.
- **FR-044**: System MUST provide visual charts and graphs for data visualization.
- **FR-045**: System MUST allow filtering analytics by date ranges.

#### Profile & Settings
- **FR-046**: System MUST allow users to view and edit their profile information.
- **FR-047**: System MUST allow users to change their password.
- **FR-048**: System MUST provide application settings for notifications and preferences.
- **FR-049**: System MUST allow users to select their preferred location if multiple bakery locations exist.

#### Visual Design & User Experience
- **FR-050**: System MUST maintain consistent visual styling with the warm amber/orange brand colors and modern design tokens.
- **FR-051**: System MUST provide smooth transitions and animations for navigation and state changes.
- **FR-052**: System MUST display loading states when fetching data.
- **FR-053**: System MUST show appropriate empty states when no data is available.
- **FR-054**: System MUST display error messages when data requests fail.
- **FR-055**: System MUST be fully responsive across desktop, tablet, and mobile screen sizes.
- **FR-056**: System MUST use component-scoped styling to prevent style conflicts.

#### Backend Integration
- **FR-057**: System MUST fetch all data from the existing backend services.
- **FR-058**: System MUST send authentication credentials with every data request.
- **FR-059**: System MUST handle backend errors gracefully with user-friendly error messages.
- **FR-060**: System MUST implement appropriate loading states during data fetching operations.

### Key Entities

- **User**: Represents authenticated bakery staff with profile information, role, and preferences
- **Order**: Customer orders with items, status, pricing, delivery/pickup details, and timestamps
- **Product**: Bakery products with names, descriptions, pricing, categories, and availability
- **Recipe**: Recipes with ingredients, quantities, instructions, and cost calculations
- **Inventory**: Ingredients and supplies with current stock levels, units, consumption rates, lead times, and user-configurable reorder thresholds (with predictive defaults based on consumption patterns)
- **Customer**: Customer information with contact details, order history, and preferences
- **Production Batch**: Production schedules linking recipes to orders with timing and quantities
- **Analytics Data**: Aggregated business metrics including sales, trends, and performance indicators
- **Widget Configuration**: User-specific dashboard layout preferences including widget types, positions, and count (maximum 20 widgets per user)
- **Location**: Bakery location information for multi-location support

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, specific APIs avoided)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (all acceptance scenarios have clear outcomes)
- [x] Scope is clearly bounded (dashboard migration from old SSR app to new SPA)
- [x] Dependencies identified (existing backend, website authentication system)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
