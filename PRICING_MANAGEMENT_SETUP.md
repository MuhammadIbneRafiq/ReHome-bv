# Pricing Management System Setup Guide

## Overview

The pricing management system allows administrators to configure and manage all pricing-related settings through a web interface. This includes base prices, multipliers, city-specific rates, and add-on services.

## ✅ What's Been Implemented

### 1. **OpenWeather API Integration (with 5-second timeout)**
- Modified `distanceCalculations.ts` to try OpenWeather API first
- 5-second timeout before falling back to hardcoded cities
- Enhanced reliability and accuracy for geocoding

### 2. **Complete Admin Dashboard Pricing Management**
- Full CRUD operations for pricing configurations
- Real-time editing of city base prices
- Multiplier management (student discounts, elevator fees, etc.)
- Add-on service pricing
- Active/inactive status toggles

### 3. **Backend API with Supabase Integration**
- RESTful API endpoints for all pricing operations
- Supabase database integration
- Row Level Security (RLS) policies
- Automated timestamp updates

### 4. **Database Schema**
- `pricing_configs` table for all configuration types
- `city_base_prices` table for city-specific rates
- `pricing_multipliers` table for various multipliers
- Proper indexing and constraints

## 🚀 Setup Instructions

### 1. Frontend Setup (Already Complete)

The frontend components are already implemented in:
- `AdminDashboard.tsx` - Main admin interface
- `pricingAdminService.ts` - API service layer
- `types/pricing.ts` - TypeScript interfaces

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Variables
Create `backend/.env` with:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: OpenWeather API
OPENWEATHER_API_KEY=your_openweather_api_key
```

#### Start Backend Server
```bash
npm run dev
# or
npm start
```

### 3. Database Setup (Supabase)

#### Run Database Schema
1. Go to your Supabase project
2. Open the SQL Editor
3. Run the SQL from `backend/db/pricing_schema.sql`

This will create:
- All necessary tables
- Default pricing configurations
- Proper indexes and policies
- Sample data for testing

#### Verify Setup
After running the schema, you should see:
- 13 default pricing configurations
- 20 city base prices
- 8 pricing multipliers

### 4. Frontend Environment

Add to your frontend `.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
```

## 📊 Admin Dashboard Features

### 1. **Pricing Configurations**
- Create new pricing rules
- Edit existing configurations
- Toggle active/inactive status
- Delete unwanted configurations
- Filter by type (base_price, multiplier, distance_rate, addon)

### 2. **City Base Prices**
- Manage base prices for each city
- Set distance rates (€/km beyond 8km)
- Enable/disable cities
- Real-time editing

### 3. **Search & Filter**
- Search across all pricing configurations
- Filter by category, type, or status
- Quick access to specific settings

## 🔧 API Endpoints

### Pricing Configurations
```
GET    /api/admin/pricing-configs     - Get all configurations
POST   /api/admin/pricing-configs     - Create new configuration
PUT    /api/admin/pricing-configs/:id - Update configuration
DELETE /api/admin/pricing-configs/:id - Delete configuration
```

### City Prices
```
GET    /api/admin/city-prices         - Get all city prices
POST   /api/admin/city-prices         - Create new city price
PUT    /api/admin/city-prices/:id     - Update city price
DELETE /api/admin/city-prices/:id     - Delete city price
```

### Pricing Multipliers
```
GET    /api/admin/pricing-multipliers     - Get all multipliers
POST   /api/admin/pricing-multipliers     - Create new multiplier
PUT    /api/admin/pricing-multipliers/:id - Update multiplier
DELETE /api/admin/pricing-multipliers/:id - Delete multiplier
```

## 🎯 Usage Examples

### Adding a New City
1. Go to Admin Dashboard → Pricing Management
2. Scroll to "City Base Prices" section
3. Click edit on any existing city or add via API
4. Set base price and distance rate
5. Enable the city

### Creating a Seasonal Discount
1. Click "Add New Configuration"
2. Select Type: "Multiplier"
3. Set Category: "house_moving"
4. Name: "Summer Discount"
5. Value: 0.85 (15% discount)
6. Unit: "x"
7. Save configuration

### Updating Student Discount
1. Find "Student Discount" in pricing configurations
2. Click edit button
3. Modify the value (e.g., 0.75 for 25% off)
4. Changes apply immediately

## 🔐 Security Features

### Row Level Security (RLS)
- Admin-only access to modify pricing
- Public read access to active configurations
- Automatic user authentication checks

### API Security
- CORS protection
- Request validation
- Error handling
- Rate limiting (configurable)

## 🧪 Testing

### Test API Health
```bash
curl http://localhost:3001/health
```

### Test Pricing Endpoints
```bash
# Get all pricing configs
curl http://localhost:3001/api/admin/pricing-configs

# Get city prices
curl http://localhost:3001/api/admin/city-prices
```

## 📝 Database Tables Structure

### pricing_configs
- `id` (UUID) - Primary key
- `type` - Configuration type (multiplier, base_price, distance_rate, addon)
- `category` - Service category (house_moving, item_transport, special_request)
- `name` - Configuration name
- `description` - Detailed description
- `value` - Numeric value
- `unit` - Unit of measurement (€, %, €/km, x)
- `active` - Status flag
- `created_at` / `updated_at` - Timestamps

### city_base_prices
- `id` (UUID) - Primary key
- `city` - City name (unique)
- `base_price` - Base service price
- `distance_rate` - Cost per km beyond 8km
- `active` - Status flag
- `created_at` / `updated_at` - Timestamps

### pricing_multipliers
- `id` (UUID) - Primary key
- `name` - Multiplier name
- `description` - Description
- `multiplier` - Numeric multiplier value
- `category` - Multiplier category (elevator, student, time, etc.)
- `active` - Status flag
- `created_at` / `updated_at` - Timestamps

## 🚨 Troubleshooting

### Backend Won't Start
1. Check if all dependencies are installed: `npm install`
2. Verify environment variables in `.env`
3. Ensure Supabase credentials are correct
4. Check if port 3001 is available

### Admin Dashboard Not Loading Data
1. Verify backend is running on port 3001
2. Check browser console for CORS errors
3. Ensure admin user has proper permissions
4. Verify Supabase RLS policies

### Database Errors
1. Check Supabase connection in backend logs
2. Verify RLS policies are set correctly
3. Ensure service role key has proper permissions
4. Run database schema if tables don't exist

## 🎉 Success!

You now have a complete pricing management system with:
- ✅ Real-time pricing configuration
- ✅ Database-backed settings
- ✅ Admin dashboard interface
- ✅ OpenWeather API integration
- ✅ Supabase backend
- ✅ Secure API endpoints
- ✅ Comprehensive CRUD operations

The system supports dynamic pricing updates, city-specific rates, and flexible multiplier configurations, all manageable through the admin dashboard! 