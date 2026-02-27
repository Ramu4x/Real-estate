# Real Estate Marketplace Platform

A comprehensive Real Estate Marketplace Platform built with Node.js, Express.js, and AI integration. This platform connects property buyers, sellers, and agents through a centralized system with advanced AI-powered features.

## 🚀 Features

### Core Features
- **User Authentication**: JWT-based authentication with role-based access (admin, seller, buyer)
- **Property Management**: Create, read, update, delete property listings
- **Advanced Search**: Filter properties by price, location, type, bedrooms, and more
- **Image Upload**: Cloud-based image storage with Cloudinary integration
- **Favorites System**: Users can save favorite properties
- **User Profiles**: Comprehensive user management with preferences

### AI-Powered Features
- **🤖 Price Prediction**: AI-driven property price estimation using OpenAI
- **🧠 Property Recommendations**: Smart recommendations based on user preferences
- **📝 AI Description Generator**: Automatically generate compelling property descriptions
- **💬 Virtual Tour Assistant**: AI chatbot for property inquiries
- **📊 Market Analysis**: Real-time market insights and trends

### Additional Features
- **Real-time Chat**: (Planned) Messaging system between users
- **Property Search History**: Track user search patterns
- **Pagination & Sorting**: Efficient data handling
- **RESTful API**: Well-documented API endpoints
- **Error Handling**: Comprehensive error management

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI GPT API
- **File Storage**: Cloudinary
- **Validation**: express-validator
- **Image Processing**: Multer + Cloudinary transformations
- **API Documentation**: Custom documentation

## 📁 Project Structure

```
realestate/
├── config/
│   ├── db.js              # Database connection
│   └── cloudinary.js      # Cloudinary configuration
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── propertyController.js # Property management
│   ├── aiController.js    # AI features
│   └── userController.js  # User management
├── middleware/
│   ├── authmiddleware.js  # JWT authentication
│   └── roleMiddleware.js  # Role-based access control
├── models/
│   ├── User.js           # User schema
│   └── Property.js       # Property schema
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── propertyRoutes.js # Property routes
│   ├── aiRoutes.js       # AI routes
│   └── userRoutes.js     # User routes
├── services/
│   ├── aiService.js      # OpenAI integration
│   └── cloudinaryService.js # Image upload service
├── .env                  # Environment variables
├── server.js             # Main server file
├── package.json          # Dependencies
├── API_DOCUMENTATION.md  # API documentation
├── frontend_test.html    # Frontend testing interface
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.20.1
- MongoDB (local or cloud)
- OpenAI API key
- Cloudinary account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd realestate
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/realestate_db
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Run the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get specific property
- `POST /api/properties` - Add new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `POST /api/properties/:id/favorite` - Toggle favorite
- `GET /api/properties/favorites/my` - Get favorites

### AI Features
- `POST /api/ai/predict-price` - AI price prediction
- `POST /api/ai/generate-description` - Generate property description
- `GET /api/ai/recommendations` - Get recommendations
- `POST /api/ai/tour-assistant` - Virtual tour assistant
- `GET /api/ai/market-analysis` - Market analysis

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/preferences` - Update preferences
- `GET /api/users/properties/my` - Get user's properties

## 🧪 Testing

### Using the Frontend Test Interface
Open `frontend_test.html` in your browser to test all API endpoints through a user-friendly interface.

### Using cURL
```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Get properties
curl http://localhost:5000/api/properties
```

### Using Postman
Import the API endpoints from `API_DOCUMENTATION.md` into Postman for comprehensive testing.

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String,
  password: String,
  role: String, // admin, seller, buyer
  phone: String,
  avatar: String,
  isVerified: Boolean,
  preferences: {
    location: String,
    propertyType: String,
    minPrice: Number,
    maxPrice: Number
  },
  searchHistory: [SearchHistory],
  favorites: [PropertyId]
}
```

### Property Model
```javascript
{
  title: String,
  description: String,
  price: Number,
  location: String,
  type: String, // flat, house, plot, commercial
  bedrooms: Number,
  bathrooms: Number,
  area: Number,
  amenities: [String],
  status: String, // available, pending, sold
  images: [String],
  latitude: Number,
  longitude: Number,
  viewCount: Number,
  favoriteCount: Number,
  createdBy: UserId
}
```

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Rate limiting (planned)
- CORS protection

## 🎯 AI Integration Details

### OpenAI Services Used
- **GPT-3.5-turbo**: For all AI-powered features
- **Price Prediction**: Market analysis and price estimation
- **Content Generation**: Property descriptions and marketing copy
- **Recommendation Engine**: Personalized property suggestions
- **Virtual Assistant**: Interactive property tour guide

### Cost Management
- API rate limiting to control costs
- Caching of frequent AI responses
- Configurable token limits per request

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production` in environment variables
2. Use production MongoDB connection string
3. Configure proper security headers
4. Set up SSL/HTTPS

### Hosting Options
- **Heroku**: Easy deployment with add-ons
- **AWS**: EC2 instances with MongoDB Atlas
- **DigitalOcean**: Cost-effective VPS hosting
- **Vercel**: For frontend deployment (if separate)

## 📈 Future Enhancements

### Planned Features
- [ ] Real-time chat with Socket.io
- [ ] Property comparison tool
- [ ] Mortgage calculator
- [ ] Virtual property tours (360° images)
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Payment integration
- [ ] Property valuation reports

### Performance Improvements
- [ ] Redis caching implementation
- [ ] Database indexing optimization
- [ ] API response compression
- [ ] Image optimization pipeline
- [ ] Load balancing setup

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@realestateplatform.com or open an issue in the repository.

## 🙏 Acknowledgments

- OpenAI for providing the GPT API
- Cloudinary for image management services
- MongoDB for database solutions
- The Node.js and Express.js communities

---
**Built with ❤️ for the Real Estate Industry**