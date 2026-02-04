# 🎓 Phonics Learning Web Application - Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local installation or MongoDB Atlas account) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** (optional, for cloning) - [Download here](https://git-scm.com/)

## Installation Steps

### 1. Backend Setup

```bash
# Navigate to the backend folder
cd backend

# Install dependencies (if npm is available)
# npm install

# Create environment file
# Copy env.example to .env and update with your values
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/phonics_learning
# JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
# JWT_EXPIRE=7d
# NODE_ENV=development

# Run database seeder (optional - adds sample data)
# npm run seed

# Start the backend server
# npm run dev
```

**Manual Installation (if npm is not available):**
You'll need to install Node.js first, then run the commands above.

### 2. Frontend Setup

```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies (if npm is available)
# npm install

# Create environment file
# Copy env.example to .env
# VITE_API_URL=http://localhost:5000/api

# Start the frontend development server
# npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
Learnova_Web_App/
├── backend/
│   ├── config/          # Database and JWT configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth and error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions and seed data
│   ├── server.js        # Main server file
│   └── package.json     # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   │   └── activities/  # Game components
│   │   ├── pages/       # Main pages
│   │   ├── redux/       # State management
│   │   │   └── slices/  # Redux slices
│   │   ├── utils/       # Utility functions
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   ├── index.html       # HTML template
│   ├── vite.config.js   # Vite configuration
│   └── package.json     # Frontend dependencies
│
└── README.md            # This file
```

## Key Features Implemented

### ✅ Backend
- **Authentication System**: JWT-based login/register with secure password hashing
- **Database Models**: User, Level, Unit, and UserProgress schemas
- **API Routes**: Complete REST API for all features
- **Progress Tracking**: Detailed activity completion and scoring
- **Future-Ready**: Subscription model support (isPremium flags)

### ✅ Frontend
- **Login/Register Pages**: Clean, kid-friendly forms
- **Adventure Map Dashboard**: Visual level progression with locking mechanism
- **Level & Unit Views**: Navigate through curriculum hierarchy
- **5 Interactive Activities**:
  1. **Sight Word Pop** - Click bubbles to match audio
  2. **Phonics Builder** - Drag & drop letters to build words
  3. **Dictation Station** - Listen and type words
  4. **Syllable Ninja** - Split words into syllables
  5. **Karaoke Reader** - Follow-along reading with highlighting

### 🎨 UI/UX Features
- Kid-friendly fonts (Comic Neue, Nunito)
- Bright, engaging color palette
- Smooth animations with Framer Motion
- Visual feedback (stars, confetti, sounds)
- Responsive design for tablets and desktops

## Database Seeding

The project includes sample data for testing:
- 3 Levels (Ocean Adventure, Space Explorer, Jungle Quest)
- 2 Units per level with sample content
- Sight words, decodable words, and activities

Run the seeder:
```bash
cd backend
npm run seed
```

## Default Test Account

You can create your own account, or use these credentials (if seeded):
- **Email**: test@example.com
- **Password**: password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Levels
- `GET /api/levels` - Get all levels with progress
- `GET /api/levels/:levelId` - Get specific level with units

### Units
- `GET /api/units/:unitId` - Get specific unit with content

### Progress
- `GET /api/progress` - Get user's progress
- `PUT /api/progress/activity` - Update activity progress
- `GET /api/progress/stats` - Get statistics

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running: `mongod` (or check MongoDB service)
- Verify MONGODB_URI in backend/.env
- For MongoDB Atlas, ensure IP whitelist is configured

### Port Already in Use
- Backend (5000): Change PORT in backend/.env
- Frontend (5173): Change in frontend/vite.config.js

### Dependencies Not Installing
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Try `npm install --legacy-peer-deps` if conflicts occur

## Next Steps

### For Development
1. Add real audio files to `/frontend/public/assets/audio/`
2. Add images to `/frontend/public/assets/images/`
3. Create more levels and units via Admin panel (to be built)
4. Implement payment gateway for subscriptions

### For Production
1. Set up environment variables securely
2. Configure MongoDB Atlas for cloud database
3. Deploy backend (Heroku, Railway, or similar)
4. Deploy frontend (Vercel, Netlify, or similar)
5. Set up CDN for media files

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React.js + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State Management | Redux Toolkit |
| Drag & Drop | React DnD |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Authentication | JWT |
| HTTP Client | Axios |

## Support

For questions or issues:
1. Check the code comments in each file
2. Review the API endpoint documentation above
3. Ensure all environment variables are set correctly

## License

Proprietary - All Rights Reserved

---

**Happy Coding! 🚀**
