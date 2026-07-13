const nodemailer = require("nodemailer");

// Create transport dynamically based on env keys
const createTransport = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
  }
  return null;
};

const sendHtmlEmail = async (to, subject, htmlContent) => {
  const transport = createTransport();
  
  if (transport) {
    try {
      await transport.sendMail({
        from: `"TravelNest Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent
      });
      console.log(`[EMAIL SENT SUCCESS] Subject: "${subject}" To: "${to}"`);
    } catch (err) {
      console.error("[EMAIL SENDING ERROR]", err);
    }
  } else {
    // Graceful Simulated Local Console Fallback Logger
    console.log(`\n============== SIMULATED HTML EMAIL TRANSACTION LOG ==============`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`------------------------------------------------------------------`);
    console.log(`BODY:\n${htmlContent.replace(/<[^>]*>/g, '').trim().substring(0, 400)}...`);
    console.log(`==================================================================\n`);
  }
};

module.exports.sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #f1f5f9; border-radius: 12px;">
      <h2 style="color: #fe424d;">Welcome to TravelNest! 🌍</h2>
      <p>Hi @${user.username},</p>
      <p>Thank you for signing up for TravelNest. Find premium holiday stays or list your own spaces to start earning today.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <span style="color: #94a3b8; font-size: 11px;">This is an automated notification. TravelNest Support.</span>
    </div>
  `;
  await sendHtmlEmail(user.email, "Welcome to TravelNest!", html);
};

module.exports.sendBookingConfirmationEmail = async (user, booking, listing) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #f1f5f9; border-radius: 12px;">
      <h2 style="color: #10b981;">Stay Reservation Confirmed! ✈️</h2>
      <p>Hi @${user.username},</p>
      <p>Your stay reservation has been confirmed and paid. Here are your booking details:</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; color: #1e293b;">${listing.title}</h4>
        <p style="margin: 3px 0; font-size: 13px;">Check In: <strong>${new Date(booking.checkIn).toLocaleDateString()}</strong></p>
        <p style="margin: 3px 0; font-size: 13px;">Check Out: <strong>${new Date(booking.checkOut).toLocaleDateString()}</strong></p>
        <p style="margin: 3px 0; font-size: 13px;">Total Paid Amount: <strong>₹${booking.totalPrice?.toLocaleString()}</strong></p>
        <p style="margin: 3px 0; font-size: 13px;">Booking ID: <strong>#${booking._id}</strong></p>
      </div>

      <p>Need directions or help? Check our in-app chat to talk directly with your host!</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <span style="color: #94a3b8; font-size: 11px;">This is an automated notification. TravelNest Support.</span>
    </div>
  `;
  await sendHtmlEmail(user.email, "Booking Confirmation - TravelNest", html);
};

module.exports.sendBookingCancellationEmail = async (user, booking, listing) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #f1f5f9; border-radius: 12px;">
      <h2 style="color: #ef4444;">Stay Reservation Cancelled</h2>
      <p>Hi @${user.username},</p>
      <p>Your booking stay reservation for <strong>${listing.title}</strong> has been cancelled. If any charges were made, refunds will follow within 3-5 business days.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <span style="color: #94a3b8; font-size: 11px;">This is an automated notification. TravelNest Support.</span>
    </div>
  `;
  await sendHtmlEmail(user.email, "Booking Cancellation - TravelNest", html);
};
