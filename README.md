# 🎓 Phonics Learning Web Application (SaaS)

## Overview
An interactive, gamified phonics learning platform for children aged 4-8, designed to accompany a physical curriculum book series.

## Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, helmet, cors

## Features

### 🎮 Gamified Learning Modules
1. **Sight Word Pop** - Click bubbles to match audio prompts
2. **Phonics Builder** - Drag & drop letters to spell words
3. **Dictation Station** - Audio-to-text input practice
4. **Syllable Ninja** - Word segmentation exercises
5. **Karaoke Reader** - Follow-along reading with highlighting

### 🗺️ Adventure Map Dashboard
- Visual level progression system
- Locked/unlocked mechanics based on completion
- Progress tracking with scores

### 👤 User Management
- JWT-based authentication
- Progress tracking per user
- Future-ready for subscription models (isPremium flags)

## Project Structure

```
Learnova_Web_App/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/phonics_learning
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Database Schema

### Collections
1. **Users** - Authentication and profile data
2. **Levels** - Curriculum hierarchy (8 levels)
3. **Units** - Learning units (5 per level)
4. **UserProgress** - Completion tracking and scores

## Development Roadmap

- [x] Database schema design
- [x] Authentication system
- [x] Core API routes
- [x] Frontend setup with Vite
- [x] Adventure Map UI
- [x] Gamified activity components
- [ ] Audio integration
- [ ] Admin panel for content management
- [ ] Subscription/payment integration

## License
Proprietary - All Rights Reserved

## Contact
For questions or support, please contact the development team.
