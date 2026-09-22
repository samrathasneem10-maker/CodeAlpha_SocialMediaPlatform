# NovaSocial — CodeAlpha Full Stack Development Internship Task 2

NovaSocial is a complete Instagram-inspired social media platform built with its own brand, UI, code and assets. It follows the provided CodeAlpha Task 2 specification while avoiding Instagram trademarks, source code and proprietary assets.

## Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Multer
- REST API

## Features

### Authentication
- Register
- Login
- Logout
- JWT-protected API routes
- bcrypt password hashing
- localStorage session
- validation and useful error messages

### Social
- Personalized feed
- Stories row
- Create posts with local image upload
- Caption + location
- Like/unlike
- Comments
- Follow/unfollow
- User search
- Profiles
- Followers/following data
- Saved posts
- Explore grid
- Notifications for likes/comments/follows
- Delete own posts only
- Edit profile + profile picture
- Light/dark mode
- Responsive mobile bottom navigation
- Loading, empty and error states
- Toasts and confirmation dialogs

## Architecture

```text
Browser
  └─ Vanilla JS SPA
       └─ REST API
            └─ Express
                 ├─ JWT auth middleware
                 ├─ Multer image uploads
                 └─ Mongoose
                      └─ MongoDB
```

## Database

### User
username, name, email, password hash, bio, profileImage, website, followers, following, createdAt

### Post
author, image, caption, location, likes, savedBy, createdAt

### Comment
post, author, text, createdAt

### Notification
recipient, actor, type, post, read, createdAt

## API endpoints

### Auth
POST `/api/auth/register`
POST `/api/auth/login`

### User
GET `/api/users/me`
PUT `/api/users/me`
POST `/api/users/me/avatar`
GET `/api/users/search?q=`
GET `/api/users/:username`
POST `/api/users/:username/follow`

### Posts
GET `/api/feed`
GET `/api/explore`
GET `/api/saved`
POST `/api/posts`
DELETE `/api/posts/:id`
POST `/api/posts/:id/like`
POST `/api/posts/:id/save`
GET `/api/posts/:id`
GET `/api/comments/:postId`
POST `/api/comments/:postId`

### Notifications
GET `/api/notifications`
POST `/api/notifications/read`

## Installation

### 1. Install Node.js
Use a current Node.js LTS release.

### 2. Install MongoDB
Use MongoDB Community Server locally, or create a MongoDB Atlas cluster.

### 3. Configure environment

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/codealpha_novasocial
JWT_SECRET=replace_with_a_long_random_secret
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

### 4. Install dependencies

```bash
npm install
```

### 5. Seed demo data

```bash
npm run seed
```

### 6. Start

```bash
npm start
```

Open:

`http://localhost:5000`

## Demo credentials

Email: `samra@example.com`
Password: `Password123!`

Other seeded accounts use the same password:
- alex@example.com
- mia@example.com
- daniel@example.com
- sarah@example.com
- emma@example.com

## Image uploads

- Post images: JPG, PNG, WEBP or GIF
- Maximum post image size: 8 MB
- Profile images: JPG, PNG, WEBP or GIF
- Maximum profile image size: 5 MB
- Files are stored locally under `public/uploads/`

## GitHub

Recommended repository name:

`CodeAlpha_SocialMediaPlatform`

Commands:

```bash
git init
git add .
git commit -m "Build NovaSocial full-stack social media platform"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Do not commit `.env` or real secrets.

## CodeAlpha Task 2 mapping

- [x] User profiles
- [x] Posts
- [x] Comments
- [x] Like system
- [x] Follow system
- [x] HTML
- [x] CSS
- [x] JavaScript
- [x] Express.js
- [x] MongoDB
- [x] Authentication
- [x] Full-stack architecture
- [x] Search
- [x] Saved posts
- [x] Notifications
- [x] Image upload
- [x] Edit profile
- [x] Explore
- [x] Dark mode
- [x] Responsive mobile UI
- [x] JWT
- [x] Password hashing

## Screenshots to add to README

After running the project, capture:
1. Login/register
2. Home feed
3. Create post modal
4. Explore grid
5. Profile
6. Notifications
7. Dark mode
8. Mobile layout

## Demo video sequence

1. Register/login.
2. Show populated feed.
3. Like a post.
4. Add a comment.
5. Follow another user.
6. Search for a user.
7. Open the profile.
8. Create a post with an uploaded image.
9. Open Explore.
10. Save a post and show Saved.
11. Show Notifications.
12. Toggle dark mode.
13. Resize to mobile and show bottom navigation.

## Future improvements

- Real-time messaging with Socket.IO
- Stories stored in MongoDB
- Cloud image storage
- Email verification
- Password reset
- Rate limiting
- Content moderation
- Infinite scrolling
- Production deployment
