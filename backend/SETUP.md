# Backend Setup Guide

This guide will help you set up and deploy the Student Sites backend system.

## Prerequisites

- Node.js 22 or higher
- MySQL 8.0+ or compatible database
- Git
- Stripe account (for payments)
- AWS account (for S3 file storage)

## Step 1: Clone and Install

```bash
# Clone the repository (if not already done)
git clone https://github.com/JonasF24/StudentSites.git
cd StudentSites/backend

# Install dependencies
pnpm install
```

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/student_sites

# Admin Emails (comma-separated)
ADMIN_EMAILS=studentsitessupport@gmail.com,j9414104@gmail.com

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1

# OAuth (if using Manus OAuth)
OAUTH_SERVER_URL=https://api.manus.im
VITE_APP_ID=your_app_id
JWT_SECRET=your_jwt_secret

# Analytics
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

## Step 3: Database Setup

### Option A: Using Manus (Recommended)

If you're using the Manus platform, the database is automatically provisioned. Just ensure `DATABASE_URL` is set correctly.

### Option B: Local MySQL

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE student_sites;"

# Run migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Step 4: Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Copy your Secret Key and add to `.env` as `STRIPE_SECRET_KEY`
3. Set up webhook:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret and add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Step 5: AWS S3 Setup

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Create an S3 bucket for file storage
3. Create IAM user with S3 access:
   - Go to IAM → Users → Create User
   - Attach policy: `AmazonS3FullAccess`
   - Create access keys
   - Add to `.env`:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_S3_BUCKET` (bucket name)

## Step 6: Google Forms Integration (Optional)

To automatically create orders from Google Forms submissions:

1. Go to your Google Form
2. Click "⋯" → "Script editor"
3. Add this script:

```javascript
function onFormSubmit(e) {
  const response = e.response;
  const itemResponses = response.getItemResponses();
  
  const data = {
    fullName: itemResponses[0].getResponse(),
    email: itemResponses[1].getResponse(),
    phone: itemResponses[2].getResponse(),
    schoolName: itemResponses[3].getResponse(),
    grade: itemResponses[4].getResponse(),
    packageType: itemResponses[5].getResponse(),
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch('https://your-domain.com/api/webhooks/google-forms', options);
}
```

4. Deploy as web app with "Execute as" your account

## Step 7: Start Development Server

```bash
pnpm dev
```

The server will start at `http://localhost:3000`

Access the application:
- Home: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin (after login with admin email)
- Customer Portal: http://localhost:3000/customer (after login)

## Step 8: Run Tests

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test auth.test.ts

# Watch mode
pnpm test --watch
```

## Step 9: Build for Production

```bash
# Build
pnpm build

# Start production server
pnpm start
```

## Deployment

### Option A: Deploy to Manus

If using Manus platform, deployment is automatic. Just push to your repository.

### Option B: Deploy to Other Platforms

**Railway:**
```bash
railway link
railway up
```

**Render:**
1. Connect GitHub repository
2. Create new Web Service
3. Set build command: `pnpm build`
4. Set start command: `pnpm start`
5. Add environment variables
6. Deploy

**Vercel (Frontend only):**
```bash
vercel deploy
```

## Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check MySQL service is running
- Ensure database user has proper permissions

### Stripe Webhook Not Working
- Verify webhook URL is publicly accessible
- Check webhook secret in `.env`
- Review Stripe dashboard for webhook logs

### S3 Upload Failing
- Verify AWS credentials
- Check S3 bucket exists and is accessible
- Ensure IAM user has S3 permissions
- Check bucket CORS configuration

### Tests Failing
- Run `pnpm install` to ensure all dependencies are installed
- Check database is running and accessible
- Clear node_modules and reinstall if needed

## Admin Access

Users with these emails automatically get admin access:
- `studentsitessupport@gmail.com`
- `j9414104@gmail.com`

To add more admin emails, update the `ADMIN_EMAILS` environment variable.

## Email Notifications (Optional)

To enable email notifications for orders and revisions, configure an email service:

1. Choose a service (SendGrid, AWS SES, Mailgun, etc.)
2. Add API credentials to `.env`
3. Implement email handlers in `server/webhooks/email.ts`

## Monitoring

Monitor your application:
- **Logs**: Check `.manus-logs/` directory for dev server logs
- **Database**: Use MySQL client to query database
- **Stripe**: Monitor webhooks in Stripe dashboard
- **S3**: Check S3 bucket for uploaded files

## Next Steps

1. Customize the design system in `client/src/index.css`
2. Add your business logic to order processing
3. Set up email notifications
4. Configure analytics tracking
5. Test end-to-end order flow
6. Deploy to production

## Support

For issues or questions:
- Check the main [README.md](./README.md)
- Review error logs in `.manus-logs/`
- Contact: studentsitessupport@gmail.com
