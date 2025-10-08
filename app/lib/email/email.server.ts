// Email service for booking notifications
// In production, integrate with services like SendGrid, Mailgun, or AWS SES

interface BookingEmailData {
  id: string;
  bookingNumber: string;
  user: {
    name: string;
    email: string;
  };
  accommodation: {
    name: string;
    address: string;
    city: string;
    country: string;
  };
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  specialRequests?: string;
}

interface PaymentData {
  method: string;
  transactionId: string;
  amount: number;
}

// Booking Confirmation Email Template
export function generateBookingConfirmationEmail(booking: BookingEmailData, payment: PaymentData) {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));

  return {
    to: booking.user.email,
    subject: `Booking Confirmed - ${booking.accommodation.name} | FindoTrip`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #01502E; color: white; padding: 30px 20px; text-align: center; }
          .content { background: white; padding: 30px 20px; }
          .booking-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .highlight { background: #01502E; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          .button { background: #01502E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Your reservation is all set, ${booking.user.name}</p>
          </div>
          
          <div class="content">
            <div class="highlight">
              <h2>Confirmation Number: ${booking.bookingNumber}</h2>
              <p>Save this number for your records</p>
            </div>
            
            <h3>📍 Your Stay</h3>
            <div class="booking-details">
              <h4>${booking.accommodation.name}</h4>
              <p>${booking.accommodation.address}<br>
              ${booking.accommodation.city}, ${booking.accommodation.country}</p>
              
              <div class="detail-row">
                <strong>Check-in:</strong>
                <span>${checkInDate} (after 3:00 PM)</span>
              </div>
              <div class="detail-row">
                <strong>Check-out:</strong>
                <span>${checkOutDate} (before 11:00 AM)</span>
              </div>
              <div class="detail-row">
                <strong>Guests:</strong>
                <span>${booking.guests} guests</span>
              </div>
              <div class="detail-row">
                <strong>Nights:</strong>
                <span>${nights} nights</span>
              </div>
            </div>
            
            ${booking.specialRequests ? `
              <h3>📝 Special Requests</h3>
              <div class="booking-details">
                <p>${booking.specialRequests}</p>
              </div>
            ` : ''}
            
            <h3>💳 Payment Information</h3>
            <div class="booking-details">
              <div class="detail-row">
                <strong>Payment Method:</strong>
                <span>${payment.method.replace('_', ' ')}</span>
              </div>
              <div class="detail-row">
                <strong>Transaction ID:</strong>
                <span>${payment.transactionId}</span>
              </div>
              <div class="detail-row">
                <strong>Total Paid:</strong>
                <span><strong>PKR ${booking.totalPrice.toLocaleString()}</strong></span>
              </div>
            </div>
            
            <h3>✅ What's Next?</h3>
            <ol>
              <li><strong>Save this confirmation:</strong> Keep this email for your records</li>
              <li><strong>Prepare for your trip:</strong> Check local weather and plan your activities</li>
              <li><strong>Check-in:</strong> Present your confirmation number at the property</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://findotrip.com/bookings/${booking.id}" class="button">View Booking Details</a>
            </div>
            
            <h3>📞 Need Help?</h3>
            <p>If you have any questions or need to make changes to your booking, please contact us:</p>
            <ul>
              <li>Email: support@findotrip.com</li>
              <li>Phone: +92 XXX XXXXXXX</li>
              <li>WhatsApp: +92 XXX XXXXXXX</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing FindoTrip!</p>
            <p>Safe travels and enjoy your stay! 🌟</p>
            <p><small>This is an automated email. Please do not reply to this message.</small></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Booking Confirmed - FindoTrip
      
      Dear ${booking.user.name},
      
      Your booking has been confirmed!
      
      Confirmation Number: ${booking.bookingNumber}
      
      Property: ${booking.accommodation.name}
      Address: ${booking.accommodation.address}, ${booking.accommodation.city}, ${booking.accommodation.country}
      
      Check-in: ${checkInDate} (after 3:00 PM)
      Check-out: ${checkOutDate} (before 11:00 AM)
      Guests: ${booking.guests}
      Nights: ${nights}
      
      ${booking.specialRequests ? `Special Requests: ${booking.specialRequests}\n\n` : ''}
      
      Payment Method: ${payment.method.replace('_', ' ')}
      Transaction ID: ${payment.transactionId}
      Total Paid: PKR ${booking.totalPrice.toLocaleString()}
      
      What's Next?
      1. Save this confirmation for your records
      2. Prepare for your trip
      3. Present your confirmation number at check-in
      
      Need help? Contact us at support@findotrip.com or +92 XXX XXXXXXX
      
      Thank you for choosing FindoTrip!
      Safe travels! 🌟
    `,
  };
}

// Booking Reminder Email Template (sent 24 hours before check-in)
export function generateBookingReminderEmail(booking: BookingEmailData) {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    to: booking.user.email,
    subject: `Reminder: Your stay at ${booking.accommodation.name} is tomorrow | FindoTrip`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #01502E; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .highlight { background: #f0f8f0; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏨 Your Stay is Tomorrow!</h1>
          </div>
          <div class="content">
            <p>Hi ${booking.user.name},</p>
            
            <p>Just a friendly reminder that your stay at <strong>${booking.accommodation.name}</strong> is tomorrow!</p>
            
            <div class="highlight">
              <h3>📅 Check-in Details</h3>
              <p><strong>Date:</strong> ${checkInDate}</p>
              <p><strong>Time:</strong> After 3:00 PM</p>
              <p><strong>Confirmation Number:</strong> ${booking.bookingNumber}</p>
            </div>
            
            <h3>📋 Before You Go</h3>
            <ul>
              <li>✅ Pack your essentials</li>
              <li>✅ Check the weather forecast</li>
              <li>✅ Have your confirmation number ready</li>
              <li>✅ Plan your route to the property</li>
            </ul>
            
            <p>We hope you have a wonderful stay!</p>
            
            <p>Best regards,<br>The FindoTrip Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

// Cancellation Confirmation Email Template
export function generateCancellationEmail(booking: BookingEmailData, refundAmount: number, refundPercentage: number) {
  return {
    to: booking.user.email,
    subject: `Booking Cancelled - ${booking.accommodation.name} | FindoTrip`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .refund-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${booking.user.name},</p>
            
            <p>Your booking has been successfully cancelled.</p>
            
            <h3>📋 Cancelled Booking Details</h3>
            <ul>
              <li><strong>Confirmation Number:</strong> ${booking.bookingNumber}</li>
              <li><strong>Property:</strong> ${booking.accommodation.name}</li>
              <li><strong>Original Total:</strong> PKR ${booking.totalPrice.toLocaleString()}</li>
            </ul>
            
            ${refundAmount > 0 ? `
              <div class="refund-info">
                <h3>💰 Refund Information</h3>
                <p><strong>Refund Amount:</strong> PKR ${refundAmount.toLocaleString()} (${refundPercentage}% of total)</p>
                <p>Your refund will be processed within 5-7 business days to your original payment method.</p>
              </div>
            ` : `
              <div class="refund-info">
                <h3>💰 Refund Information</h3>
                <p>Unfortunately, no refund is available due to our cancellation policy.</p>
              </div>
            `}
            
            <p>We're sorry to see you cancel your booking. We hope to serve you again in the future!</p>
            
            <p>Best regards,<br>The FindoTrip Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

// Function to send emails (placeholder - integrate with actual email service)
export async function sendEmail(emailData: { to: string; subject: string; html: string; text?: string }) {
  // TODO: Integrate with actual email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: emailData.to,
    from: 'noreply@findotrip.com',
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
  };
  
  try {
    await sgMail.send(msg);
    console.log('Email sent successfully to:', emailData.to);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
  */
  
  // For now, just log the email (development mode)
  console.log('📧 Email would be sent to:', emailData.to);
  console.log('📧 Subject:', emailData.subject);
  console.log('📧 Content preview:', emailData.html.substring(0, 200) + '...');
  
  return { success: true, message: 'Email queued for sending' };
}

// Convenience functions
export async function sendBookingConfirmationEmail(booking: BookingEmailData, payment: PaymentData) {
  const emailData = generateBookingConfirmationEmail(booking, payment);
  return await sendEmail(emailData);
}

export async function sendBookingReminderEmail(booking: BookingEmailData) {
  const emailData = generateBookingReminderEmail(booking);
  return await sendEmail(emailData);
}

export async function sendCancellationEmail(booking: BookingEmailData, refundAmount: number, refundPercentage: number) {
  const emailData = generateCancellationEmail(booking, refundAmount, refundPercentage);
  return await sendEmail(emailData);
}

// =============================
// Review Emails
// =============================

export function generateReviewInviteEmail(toEmail: string, toName: string, serviceName: string, reviewUrl: string) {
  return {
    to: toEmail,
    subject: `How was your experience at ${serviceName}? Share a review` ,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background:#01502E;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
          <h2>We'd love your feedback</h2>
        </div>
        <div style="padding:24px;border:1px solid #eee;border-top:0;border-radius:0 0 8px 8px;">
          <p>Hi ${toName},</p>
          <p>Thanks for choosing FindoTrip. Your insights help other travelers and our providers improve.</p>
          <p>Please take a moment to review <strong>${serviceName}</strong>.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${reviewUrl}" style="display:inline-block;background:#01502E;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Write a Review</a>
          </div>
          <p>It only takes a minute—thank you!</p>
        </div>
      </div>
    `,
  };
}

export function generateProviderReviewAlertEmail(toEmail: string, serviceLabel: string, rating: number, dashboardUrl: string) {
  return {
    to: toEmail,
    subject: `New review received (${rating}/5) on your ${serviceLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background:#01502E;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
          <h2>New Review Received</h2>
        </div>
        <div style="padding:24px;border:1px solid #eee;border-top:0;border-radius:0 0 8px 8px;">
          <p>You received a new review on your ${serviceLabel} with a rating of <strong>${rating}/5</strong>.</p>
          <p>Respond to the review and manage your reputation from your dashboard.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#01502E;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Dashboard</a>
          </div>
        </div>
      </div>
    `,
  };
}

export async function sendReviewInviteEmail(toEmail: string, toName: string, serviceName: string, reviewUrl: string) {
  const emailData = generateReviewInviteEmail(toEmail, toName, serviceName, reviewUrl);
  return await sendEmail(emailData);
}

export async function sendProviderReviewAlertEmail(toEmail: string, serviceLabel: string, rating: number, dashboardUrl: string) {
  const emailData = generateProviderReviewAlertEmail(toEmail, serviceLabel, rating, dashboardUrl);
  return await sendEmail(emailData);
}

// Authentication Email Templates

// Password Reset Email Template
export function generatePasswordResetEmail(userEmail: string, userName: string, resetToken: string) {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  return {
    to: userEmail,
    subject: 'Reset Your Password | FindoTrip',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #01502E; color: white; padding: 30px 20px; text-align: center; }
          .content { background: white; padding: 30px 20px; }
          .button { background: #01502E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>We received a request to reset your password for your FindoTrip account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
            
            <div class="warning">
              <p><strong>⚠️ Important:</strong></p>
              <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>You can only use this link once</li>
                <li>If you didn't request this reset, please contact our support team</li>
              </ul>
            </div>
            
            <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
            
            <p>Best regards,<br>The FindoTrip Security Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated security email from FindoTrip.</p>
            <p>If you have any concerns, contact us at security@findotrip.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Reset Your Password - FindoTrip
      
      Hi ${userName},
      
      We received a request to reset your password for your FindoTrip account.
      
      To reset your password, visit this link:
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this reset, you can safely ignore this email.
      
      Best regards,
      The FindoTrip Security Team
    `,
  };
}

// Welcome Email Template
export function generateWelcomeEmail(userEmail: string, userName: string, userRole: string) {
  return {
    to: userEmail,
    subject: 'Welcome to FindoTrip! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FindoTrip</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #01502E; color: white; padding: 30px 20px; text-align: center; }
          .content { background: white; padding: 30px 20px; }
          .button { background: #01502E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
          .feature-box { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #01502E; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to FindoTrip!</h1>
            <p>Your journey starts here, ${userName}</p>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>Welcome to FindoTrip! We're excited to have you join our community of travelers and adventure seekers.</p>
            
            ${userRole === 'CUSTOMER' ? `
              <div class="feature-box">
                <h3>🏨 As a Customer, you can:</h3>
                <ul>
                  <li>Browse and book amazing accommodations</li>
                  <li>Rent cars for your travels</li>
                  <li>Book experienced tour guides</li>
                  <li>Manage all your bookings in one place</li>
                  <li>Leave reviews and share your experiences</li>
                </ul>
              </div>
            ` : userRole === 'CAR_PROVIDER' ? `
              <div class="feature-box">
                <h3>🚗 As a Car Provider, you can:</h3>
                <ul>
                  <li>List your vehicles for rent</li>
                  <li>Manage your car inventory</li>
                  <li>Set your own pricing and availability</li>
                  <li>Track bookings and earnings</li>
                  <li>Build your reputation with customer reviews</li>
                </ul>
              </div>
            ` : `
              <div class="feature-box">
                <h3>🗺️ As a Tour Guide, you can:</h3>
                <ul>
                  <li>Create your professional profile</li>
                  <li>Showcase your expertise and specialties</li>
                  <li>Set your availability and rates</li>
                  <li>Connect with travelers seeking guides</li>
                  <li>Build your reputation and grow your business</li>
                </ul>
              </div>
            `}
            
            <div style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="button">Get Started</a>
            </div>
            
            <h3>🚀 What's Next?</h3>
            <ol>
              <li><strong>Complete your profile:</strong> Add more details to help others find you</li>
              <li><strong>Explore the platform:</strong> Browse accommodations, cars, and tour guides</li>
              <li><strong>Start your journey:</strong> Make your first booking or listing</li>
            </ol>
            
            <h3>📞 Need Help?</h3>
            <p>Our support team is here to help you get started:</p>
            <ul>
              <li>Email: support@findotrip.com</li>
              <li>Help Center: <a href="${process.env.APP_URL || 'http://localhost:3000'}/help">findotrip.com/help</a></li>
            </ul>
            
            <p>Thank you for choosing FindoTrip. We can't wait to see where your adventures take you!</p>
            
            <p>Happy travels,<br>The FindoTrip Team</p>
          </div>
          
          <div class="footer">
            <p>Welcome to the FindoTrip family! 🌟</p>
            <p>Follow us on social media for travel tips and inspiration</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to FindoTrip!
      
      Hi ${userName},
      
      Welcome to FindoTrip! We're excited to have you join our community.
      
      ${userRole === 'CUSTOMER' ? 'As a customer, you can browse and book accommodations, rent cars, and book tour guides.' : 
        userRole === 'CAR_PROVIDER' ? 'As a car provider, you can list your vehicles and manage bookings.' : 
        'As a tour guide, you can create your profile and connect with travelers.'}
      
      Get started: ${process.env.APP_URL || 'http://localhost:3000'}/dashboard
      
      Need help? Contact us at support@findotrip.com
      
      Happy travels,
      The FindoTrip Team
    `,
  };
}

// Convenience functions for authentication emails
export async function sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string) {
  const emailData = generatePasswordResetEmail(userEmail, userName, resetToken);
  return await sendEmail(emailData);
}

export async function sendWelcomeEmail(userEmail: string, userName: string, userRole: string) {
  const emailData = generateWelcomeEmail(userEmail, userName, userRole);
  return await sendEmail(emailData);
}
