# 2006-SCEB-K1
# SSS: Smarter, Stronger, Safer

## Health Portal Application


## Overview

SSS (Smarter, Stronger, Safer) is a comprehensive health portal application designed to create a community-driven platform where users can share health-related information, discuss medical topics, and receive alerts about important health events. The application implements a role-based access control system, allowing different levels of user participation from anonymous browsing to administrative capabilities.

## Features

### Content Management
- Create, view, edit, and delete posts
- Categorize posts by health topics
- Comment on posts and reply to comments
- Location-based posts with map integration
- Like/dislike reactions to posts

### User Management
- User registration and authentication
- Profile creation and customization
- Role-based permissions (Normal, Restricted, Moderator, Admin)
- User type management for administrators

### Moderation System
- Report inappropriate content
- Moderator review of reported content
- User restriction for policy violations

### Alert System
- Create and manage health alerts
- Filter alerts by status (current, past, all)
- Location-based alerts
- Alert expiration management

## Technologies

- **Frontend**: Vue.js with Vue Router
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Maps**: Google Maps API
- **Styling**: Custom CSS with responsive design

## Installation

1. Clone the repository:


2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
SC2006_code/
├── public/              # Public assets
├── src/                 # Source files
│   ├── assets/          # Static assets
│   ├── components/      # Reusable Vue components
│   ├── services/        # API services
│   │   ├── apiAlert.ts  # Alert management
│   │   ├── apiComment.ts # Comment management
│   │   ├── apiPost.ts   # Post management
│   │   ├── apiProfile.ts # User profile management
│   │   └── apiUserAuth.ts # Authentication
│   ├── stores/          # Pinia stores
│   ├── views/           # Vue page components
│   ├── App.vue          # Main application component
│   ├── main.ts          # Application entry point
│   ├── router.ts        # Vue Router configuration
│   └── supabase.ts      # Supabase client configuration
├── .env                 # Environment variables
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.js       # Vite configuration
```

## User Roles

1. **Anonymous User**
   - View public content
   - Register and login

2. **Normal User**
   - Create and edit own posts
   - Comment on posts
   - Like/dislike posts
   - Report inappropriate content
   - Update own profile

3. **Restricted User**
   - Limited posting capabilities
   - Can view content

4. **Moderator**
   - All Normal User privileges
   - Review reported content
   - Restrict users
   - Restore user privileges

5. **Admin**
   - All Moderator privileges
   - Manage user types
   - System-wide configuration
   - Seed sample data

## API Services

The application is structured around several API services that handle different aspects of functionality:

- **apiUserAuth**: Handles user registration, login, logout, and password reset
- **apiProfile**: Manages user profiles, types, and permissions
- **apiPost**: Handles creating, reading, updating, and deleting posts
- **apiComment**: Manages comments and replies
- **apiAlert**: Handles health alerts and notifications

## Testing

The application includes comprehensive test coverage using:

- **Unit Tests**: Testing individual components and functions
- **Integration Tests**: Testing interactions between components
- **Black Box Testing**: Including equivalence class and boundary value testing
- **White Box Testing**: Including basis path testing for complex functions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the xxx;

## Acknowledgements

- SC2006 Software Engineering course
- All contributors and team members
- Supabase for backend services
- Vue.js community

## Contact

For questions or support, please contact:
zzz
---

© 2024 SSS: Smarter, Stronger, Safer Health Portal
