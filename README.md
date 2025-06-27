# BlogSocial - Minimalist Social Platform

A modern, minimalist blog platform with social features built with Next.js 15, Tailwind CSS 4, and Prisma. This platform focuses on text-based content with a clean, impactful design using a blue color scheme.

## ✨ Features

### 🎨 Design & Styling
- **Minimalist Design**: Clean, impactful interface focusing on readability
- **Blue Color Palette**: Primary blue theme with complementary accent colors
- **Modern Typography**: Geist font family for optimal readability
- **Responsive Layout**: Works seamlessly across all device sizes
- **Dark Mode Support**: Automatic dark mode based on system preferences

### 🔐 Authentication & User Roles
- **Secure Authentication**: NextAuth.js with credentials provider
- **Two User Roles**:
  - **Admin**: Full access to CRM dashboard, user management, analytics
  - **User**: Personal profile, posting, social interactions



### 📱 Social Features (Twitter-like)
- **Text-only Posts**: 280-character limit posts
- **Social Interactions**: Like, comment, repost functionality
- **User Profiles**: Instagram-style profile pages
- **Follow System**: Follow/unfollow other users
- **Real-time Feed**: Chronological post feed
- **User Search**: Find users and content

### 👨‍💼 Admin Dashboard
- **User Management**: View, suspend, activate users
- **Analytics**: Platform statistics and user metrics
- **Content Moderation**: Post and user oversight
- **Real-time Stats**: Total users, posts, active users, daily posts

### 💬 Additional Features
- **Direct Messages**: User-to-user messaging (framework ready)
- **Notifications**: System notifications for interactions
- **Profile Customization**: Bio, avatar, user information

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd blogsocial
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. **Generate database and Prisma client**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create admin user**
   ```bash
   npm run create-admin
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Admin login: `admin@blogsocial.com` / `admin123`

## 📊 Database Schema

The platform uses SQLite with Prisma ORM. Key models include:

- **User**: Authentication, profiles, admin roles
- **Post**: Text-based content
- **Like/Comment/Repost**: Social interactions
- **Follow**: User relationships
- **Message**: Direct messaging system
- **Notification**: System notifications

### Database Setup

```bash
# Initialize database
npx prisma db push

# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma db push --force-reset
```

## 🛠️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── profile/           # User profiles
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── Navigation.tsx    # Main navigation
│   ├── PostCard.tsx      # Post display component
│   └── providers/        # Context providers
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema
└── scripts/              # Utility scripts
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Posts
- `GET /api/posts` - Fetch all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/[id]/like` - Toggle like on post

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - User management
- `PATCH /api/admin/users/[id]` - Update user status

### Users
- `GET /api/users/[id]` - User profile
- `GET /api/users/[id]/posts` - User posts

## 🎨 Styling & Design

### Color Palette
- **Primary**: Blue (#2563eb)
- **Secondary**: Gray (#f1f5f9)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Primary Font**: Geist Sans
- **Monospace**: Geist Mono
- **Focus**: Clean, readable, modern

### Components
All UI components are built with:
- Tailwind CSS utility classes
- Consistent spacing and sizing
- Accessible design patterns
- Responsive breakpoints

## 📱 Features In Detail

### User Authentication
- Secure password hashing with bcryptjs
- Session management with NextAuth.js
- Role-based access control
- Protected routes and API endpoints

### Social Features
- **Posts**: Create, edit, delete text posts (280 chars)
- **Interactions**: Like, unlike, comment, repost
- **Profile**: Instagram-style user profiles
- **Following**: Social connections between users

### Admin Panel
- **Dashboard**: Overview of platform statistics
- **User Management**: Suspend/activate user accounts
- **Content Moderation**: Monitor posts and interactions
- **Analytics**: Track platform growth and engagement

## 🔮 Future Enhancements

### Planned Features
- [ ] Direct messaging system
- [ ] Push notifications
- [ ] Advanced search functionality
- [ ] Content reporting system
- [ ] Media uploads (images)
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] API rate limiting
- [ ] Content caching

### Technical Improvements
- [ ] Performance optimization
- [ ] SEO enhancements
- [ ] Progressive Web App (PWA)
- [ ] Advanced error handling
- [ ] Comprehensive testing
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first styling
- Prisma for the excellent database toolkit
- NextAuth.js for authentication
- Lucide React for beautiful icons

---

**BlogSocial** - Where meaningful conversations happen. 🚀
