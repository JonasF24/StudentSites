# Student Sites Backend System

A comprehensive backend system for managing website orders, payments, revisions, and analytics for the Student Sites business.

## 🚀 Features

### Core Features
- **Order Management** - Create, track, and manage website orders with status progression
- **Payment Processing** - Stripe integration with webhook handling for secure payments
- **Revision Tracking** - Enforce 5 free revisions per order with 60-day expiration
- **File Management** - Secure file storage and download links for completed websites
- **Analytics Dashboard** - Real-time revenue tracking, conversion rates, and package analytics
- **Admin Dashboard** - Comprehensive order management interface with filtering and status updates
- **Customer Portal** - Order tracking, file downloads, and revision requests for students
- **Email Authentication** - Email/password signup and login with role-based access control

### Authentication
- Email/password authentication with bcryptjs password hashing
- Admin access for: `studentsitessupport@gmail.com` and `j9414104@gmail.com`
- Role-based access control (admin vs. regular user)
- Secure session management

## 📋 Tech Stack

- **Frontend**: React 19 + Tailwind CSS 4 + TypeScript
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Email/password + bcryptjs
- **Payments**: Stripe API
- **Storage**: AWS S3
- **Testing**: Vitest

## 🏗️ Project Structure

```
backend/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (Admin, Customer, Login, Signup)
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # tRPC client setup
│   │   └── index.css      # StudentSites design system
│   └── public/
├── server/                # Express backend
│   ├── routers/           # tRPC procedures (orders, payments, revisions, files, analytics, auth)
│   ├── webhooks/          # Stripe and Google Forms webhook handlers
│   ├── auth.ts            # Authentication helpers
│   ├── db.ts              # Database query helpers
│   └── _core/             # Framework core (OAuth, context, etc.)
├── drizzle/               # Database schema and migrations
│   ├── schema.ts          # 8 tables: users, customers, orders, payments, revisions, files, emailLogs, analyticsSnapshots
│   └── migrations/        # SQL migration files
├── shared/                # Shared types and constants
└── package.json           # Dependencies

```

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address (required for email/password auth)
- `password` - Hashed password (bcryptjs)
- `name` - User full name
- `role` - 'admin' or 'user'
- `loginMethod` - 'email' or 'oauth'
- `createdAt`, `updatedAt`, `lastSignedIn` - Timestamps

### Customers Table
- `id` - Primary key
- `email` - Customer email (unique)
- `fullName` - Customer name
- `phone` - Contact phone
- `schoolName` - School/university name
- `grade` - Grade level
- Timestamps

### Orders Table
- `id` - Primary key
- `customerId` - Foreign key to customers
- `status` - 'pending_payment' | 'in_progress' | 'delivered' | 'completed'
- `packageType` - Website package selected
- `price` - Order price
- `paymentStatus` - 'pending' | 'completed' | 'failed'
- `notes` - Order notes
- Timestamps

### Payments Table
- `id` - Primary key
- `orderId` - Foreign key to orders
- `stripePaymentIntentId` - Stripe payment intent ID
- `amount` - Payment amount
- `status` - 'pending' | 'succeeded' | 'failed'
- Timestamps

### Revisions Table
- `id` - Primary key
- `orderId` - Foreign key to orders
- `status` - 'pending' | 'in_progress' | 'completed'
- `requestedChanges` - Description of requested changes
- `expiresAt` - 60 days from request date
- Timestamps
- Constraint: Maximum 5 revisions per order

### Files Table
- `id` - Primary key
- `orderId` - Foreign key to orders
- `fileKey` - S3 file key
- `fileUrl` - S3 file URL
- `fileName` - Original file name
- `fileSize` - File size in bytes
- Timestamps

### Email Logs Table
- Tracks all email notifications sent

### Analytics Snapshots Table
- Daily snapshots of revenue, orders, and metrics

## 🔐 Authentication

### Signup
```
POST /api/trpc/auth.signup
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "User Name"
}
```

### Login
```
POST /api/trpc/auth.login
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Admin Access
Users with the following emails automatically get admin role:
- `studentsitessupport@gmail.com`
- `j9414104@gmail.com`

## 📊 API Endpoints

### Orders
- `orders.create` - Create new order
- `orders.list` - List all orders (admin only)
- `orders.getById` - Get order details
- `orders.updateStatus` - Update order status (admin only)
- `orders.getCustomerOrders` - Get orders for current customer

### Payments
- `payments.createPaymentIntent` - Create Stripe payment intent
- `payments.getPaymentStatus` - Get payment status

### Revisions
- `revisions.requestRevision` - Request a revision
- `revisions.listByOrder` - List revisions for an order
- `revisions.updateStatus` - Update revision status (admin only)

### Files
- `files.uploadFile` - Upload website files
- `files.getDownloadUrl` - Get secure download URL
- `files.listByOrder` - List files for an order

### Analytics
- `analytics.getDashboardMetrics` - Get key metrics
- `analytics.getRevenueChart` - Get revenue data
- `analytics.getPackageDistribution` - Get package popularity

## 🧪 Testing

Run all tests:
```bash
pnpm test
```

Run specific test file:
```bash
pnpm test auth.test.ts
```

Current test coverage:
- Authentication (14 tests) ✅
- Order management
- Payment processing
- Revision tracking
- File management

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- MySQL database
- Stripe account
- AWS S3 bucket

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - MySQL connection string
- `ADMIN_EMAILS` - Comma-separated admin emails
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET` - S3 bucket name

3. Run database migrations:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

4. Start development server:
```bash
pnpm dev
```

5. Build for production:
```bash
pnpm build
pnpm start
```

## 📱 Pages

### Public Pages
- `/` - Home page with login/signup options
- `/login` - Email/password login
- `/signup` - Email/password signup

### Admin Pages (requires admin email)
- `/admin` - Admin dashboard with order management and analytics

### Customer Pages (requires login)
- `/customer` - Customer portal with order tracking and revisions

## 🔄 Webhooks

### Stripe Webhook
- Endpoint: `/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Updates order status based on payment status

### Google Forms Webhook
- Endpoint: `/api/webhooks/google-forms`
- Receives form submissions and creates orders

## 📈 Analytics

The analytics dashboard provides:
- Total revenue
- Total orders
- Conversion rate (completed / total orders)
- Average order value
- Revenue trend chart
- Package distribution
- Order status breakdown

## 🔒 Security

- Passwords hashed with bcryptjs (10 salt rounds)
- Secure session management
- CORS protection
- Rate limiting on API endpoints
- SQL injection prevention via Drizzle ORM
- Secure file download URLs with expiration

## 📝 Design System

The frontend uses the StudentSites design system:
- **Primary Color**: #4333CC (Purple)
- **Accent Color**: #F0522D (Orange)
- **Typography**: Instrument Serif (headings), Plus Jakarta Sans (body)
- **Spacing**: Consistent 8px grid
- **Components**: shadcn/ui with StudentSites customization

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests for new features
4. Run `pnpm test` to verify
5. Submit a pull request

## 📞 Support

For issues or questions, contact:
- Email: studentsitessupport@gmail.com
- Admin: j9414104@gmail.com

## 📄 License

MIT License - See LICENSE file for details
