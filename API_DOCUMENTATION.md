# Real Estate Marketplace API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication Routes
**POST** `/auth/register`
- Register a new user
- Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "buyer" // or "seller", "admin"
}
```

**POST** `/auth/login`
- Login existing user
- Request body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Property Routes

**GET** `/properties`
- Get all properties with filtering and pagination
- Query parameters:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `type` (flat, house, plot, commercial)
  - `minPrice`, `maxPrice`
  - `location`
  - `bedrooms`
  - `sortBy` (price-low, price-high, newest)

**GET** `/properties/:id`
- Get specific property details

**POST** `/properties`
- Add new property (requires authentication)
- Form-data with files:
  - `title`, `description`, `price`, `location`, `type`
  - `bedrooms`, `bathrooms`, `area`
  - `amenities` (array)
  - `images` (multiple files, up to 10)

**PUT** `/properties/:id`
- Update property (owner or admin only)

**DELETE** `/properties/:id`
- Delete property (owner or admin only)

**POST** `/properties/:propertyId/favorite`
- Toggle favorite status for property

**GET** `/properties/favorites/my`
- Get user's favorite properties

### AI Routes

**POST** `/ai/predict-price`
- Predict property price using AI
- Request body:
```json
{
  "type": "house",
  "location": "New York",
  "area": 2000,
  "bedrooms": 3,
  "bathrooms": 2,
  "amenities": ["garden", "parking"]
}
```

**POST** `/ai/generate-description`
- Generate AI-powered property description
- Request body:
```json
{
  "propertyId": "property_id_here",
  "style": "professional" // or luxury, family, investment
}
```

**GET** `/ai/recommendations`
- Get AI-powered property recommendations
- Query parameters:
  - `location`, `propertyType`, `minPrice`, `maxPrice`

**POST** `/ai/tour-assistant`
- Virtual property tour assistant
- Request body:
```json
{
  "propertyId": "property_id_here",
  "question": "What's the neighborhood like?"
}
```

**GET** `/ai/market-analysis`
- Get real estate market analysis
- Query parameters:
  - `location` (required)
  - `propertyType` (default: residential)

### User Routes

**GET** `/users/profile`
- Get user profile (authenticated)

**PUT** `/users/profile`
- Update user profile
- Request body:
```json
{
  "name": "New Name",
  "phone": "123-456-7890"
}
```

**PUT** `/users/preferences`
- Update user preferences for recommendations
- Request body:
```json
{
  "location": "Los Angeles",
  "propertyType": "house",
  "minPrice": 300000,
  "maxPrice": 800000
}
```

**POST** `/users/search-history`
- Add search query to history
- Request body:
```json
{
  "query": "3 bedroom houses in Miami"
}
```

**GET** `/users/search-history`
- Get user's search history

**GET** `/users/properties/my`
- Get properties created by user

**GET** `/users/:id`
- Get public user information

## Example Usage

### 1. Register and Login
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "buyer"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Add Property with Images
```bash
curl -X POST http://localhost:5000/api/properties \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Beautiful Family Home" \
  -F "description=Great house in excellent location" \
  -F "price=500000" \
  -F "location=Miami, FL" \
  -F "type=house" \
  -F "bedrooms=4" \
  -F "bathrooms=3" \
  -F "area=2500" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### 3. Get AI Price Prediction
```bash
curl -X POST http://localhost:5000/api/ai/predict-price \
  -H "Content-Type: application/json" \
  -d '{
    "type": "house",
    "location": "Miami, FL",
    "area": 2500,
    "bedrooms": 4,
    "bathrooms": 3
  }'
```

### 4. Get Property Recommendations
```bash
curl -X GET "http://localhost:5000/api/ai/recommendations?location=Miami&propertyType=house&minPrice=300000&maxPrice=700000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

For errors:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Error Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Development Notes

1. Make sure MongoDB is running on localhost:27017
2. Set up environment variables in .env file
3. For AI features, add your OpenAI API key
4. For image uploads, configure Cloudinary credentials
5. Default pagination limit is 10 items per page