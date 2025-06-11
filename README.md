# MyMuayThai Admin Dashboard

A comprehensive admin dashboard for managing Muay Thai gyms and trainers, built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components. This frontend admin panel works seamlessly with the [MyMuayThai Backend](https://github.com/stateless-x/mymuaythai-be).

## 🥊 Features

- **🔐 Authentication System**: Secure login with fallback mock authentication
- **📊 Dashboard Overview**: Real-time statistics and analytics
- **🏢 Gym Management**: Complete CRUD operations for gym data
- **👨‍🏫 Trainer Management**: Manage trainers, freelancers, and staff
- **🏷️ Tag System**: Categorization and labeling system
- **🌍 Province Support**: Thai province integration
- **📱 Responsive Design**: Mobile-first responsive UI
- **🎨 Modern UI**: shadcn/ui components with Tailwind CSS
- **⚡ Performance**: Built with Next.js 15 and React 19

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Runtime**: Bun (v1.2+)

## 📋 Prerequisites

- **Bun** v1.2 or higher
- **Node.js** v18+ (for compatibility)
- **MyMuayThai Backend** (optional, has fallback)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd mymuaythai-admin
bun install
```

### 2. Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Start Development Server

```bash
bun dev
```

The application will start at: **http://localhost:3333**

### 4. Default Login Credentials

```
Email: admin@gym.com
Password: admin123
```

## 🏗️ Project Structure

```
app/
├── login/                    # Authentication pages
├── dashboard/               # Main dashboard
├── admin/                   # Admin-specific routes (legacy)
├── globals.css             # Global styles
├── layout.tsx              # Root layout with auth provider
├── page.tsx                # Home page (redirects based on auth)
└── not-found.tsx           # 404 handler with auth-based redirects

components/
├── ui/                     # shadcn/ui components
├── admin-layout.tsx        # Admin dashboard layout
└── protected-route.tsx     # Route protection wrapper

lib/
├── auth-context.tsx        # Authentication context and provider
├── api.ts                  # Backend API integration utilities
└── mock-data.ts           # Development mock data

hooks/                      # Custom React hooks
styles/                     # Additional styling
public/                     # Static assets
```

## 🔧 Configuration

### Backend Integration

The admin panel connects to the MyMuayThai backend API:

- **Backend URL**: `http://localhost:4000` (configurable via environment)
- **Authentication**: JWT-based with localStorage persistence
- **Fallback**: Mock authentication when backend is unavailable

### Available Scripts

```bash
bun dev          # Start development server (port 3333)
bun build        # Build for production
bun start        # Start production server (port 3333)
bun lint         # Run ESLint
bun type-check   # TypeScript type checking
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |

## 🔐 Authentication & Routing

### Route Protection

- **`/`** → Redirects to `/login` (if not authenticated) or `/dashboard` (if authenticated)
- **`/login`** → Login page
- **`/dashboard`** → Protected dashboard (requires authentication)
- **Invalid paths** → Redirects based on authentication status

### Authentication Flow

1. **Login attempt** → Try backend authentication
2. **Backend failure** → Fallback to mock authentication
3. **Success** → Store user data and token in localStorage
4. **Routing** → Redirect to dashboard or requested page

## 🎨 UI Components

Built with **shadcn/ui** components:

- **Forms**: Input, Label, Button, Select, Checkbox
- **Layout**: Card, Separator, Tabs, Accordion
- **Feedback**: Alert, Toast, Dialog, Progress
- **Data**: Table, Pagination, Charts
- **Navigation**: Dropdown Menu, Navigation Menu

## 📊 Dashboard Features

### Overview Statistics
- Total active trainers
- Freelancer vs staff trainers
- Registered gyms
- Active gym listings

### Management Sections
- **Gyms**: View, create, edit, delete gym profiles
- **Trainers**: Manage trainer information and status
- **Tags**: Categorization system for gyms and trainers
- **Analytics**: Data visualization and reporting

## 🔌 Backend Compatibility

### API Endpoints

The frontend expects these backend endpoints:

- `POST /auth/login` - Authentication
- `GET /gyms` - Gym listings
- `POST /gyms` - Create gym
- `PUT /gyms/:id` - Update gym
- `DELETE /gyms/:id` - Delete gym
- `GET /trainers` - Trainer listings
- `POST /trainers` - Create trainer
- `PUT /trainers/:id` - Update trainer
- `DELETE /trainers/:id` - Delete trainer
- `GET /tags` - Tag listings
- `GET /provinces` - Thai provinces

### Data Models

Compatible with MyMuayThai backend schema:

- **Gyms**: Name, description, location, contact, images, tags
- **Trainers**: Name, bio, experience, specialties, gym association
- **Tags**: Categorization labels for filtering and search
- **Provinces**: Thai geographical data

## 🚀 Deployment

### Production Build

```bash
bun build
bun start
```

### Environment Setup

For production deployment:

1. Set `NEXT_PUBLIC_API_URL` to your production backend URL
2. Configure authentication endpoints
3. Set up proper CORS on the backend
4. Enable HTTPS for secure token transmission

## 🛡️ Security Features

- **JWT Token Storage**: Secure token management
- **Route Protection**: Authenticated route guards
- **Input Validation**: Zod schema validation
- **XSS Protection**: React's built-in protections
- **Type Safety**: Full TypeScript coverage

## 🔄 Development

### Adding New Features

1. **API Integration**: Add endpoints to `lib/api.ts`
2. **UI Components**: Use shadcn/ui or create custom components
3. **Routes**: Add pages in the `app/` directory
4. **State Management**: Extend context providers as needed

### Mock Data

Development mock data is available in `lib/mock-data.ts` for offline development.

## 🤝 Backend Integration

This admin panel is designed to work with the [MyMuayThai Backend](https://github.com/stateless-x/mymuaythai-be):

- **Backend Tech**: Bun, Fastify, Drizzle ORM, PostgreSQL
- **API Documentation**: Available at `http://localhost:4000/docs`
- **Database**: PostgreSQL with comprehensive seeding
- **Features**: CRUD operations, search, categorization, Thai language support

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful UI components
- **Tailwind CSS** for utility-first styling
- **Next.js** for the React framework
- **Bun** for fast JavaScript runtime
- **Thai Muay Thai community** for inspiration 🇹🇭

---

**Made with ❤️ for the Muay Thai community in Thailand** 🥊
