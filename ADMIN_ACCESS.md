# Admin Dashboard Access

To access the admin dashboard, you need to be logged in as a SUPER_ADMIN user.

## Available Admin Users

The following admin users are available in the database:

1. **Admin User**
   - Email: `admin@example.com`
   - Password: `password123`
   - Role: SUPER_ADMIN

2. **Content Manager**
   - Email: `data@findotrip.com`
   - Password: `password123`
   - Role: SUPER_ADMIN

## How to Access Admin Dashboard

1. **Log out** if you're currently logged in as a regular user
2. **Log in** using one of the admin credentials above
3. **Navigate** to `/dashboard/admin` or click on the admin dashboard link

## Admin Dashboard Features

The admin dashboard includes:

- **Messages**: Chat with users and support
- **User Management**: Manage all platform users
- **Content Moderation**: Review and approve content
- **Analytics**: Platform metrics and trends
- **Support Center**: Tickets and provider support

## URL Structure

- Admin Dashboard: `http://localhost:5173/dashboard/admin`
- User Management: `http://localhost:5173/admin/users`
- Content Moderation: `http://localhost:5173/admin/moderation`
- Analytics: `http://localhost:5173/admin/analytics`
- Support Center: `http://localhost:5173/admin/support`

## Troubleshooting

If you're getting redirected when trying to access `/dashboard/admin`:

1. Make sure you're logged in as a SUPER_ADMIN user
2. Check that your session is valid
3. Try logging out and logging back in
4. Clear your browser cache and cookies

The redirect (302 status) indicates that the authentication middleware is working correctly and redirecting non-admin users.
