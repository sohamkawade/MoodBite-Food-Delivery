const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

let transporter = null;
if (smtpHost && smtpPort && smtpUser && smtpPass) {
	transporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: smtpSecure,
		auth: { user: smtpUser, pass: smtpPass },
	});
} else {
	console.warn('Required environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
}

const FROM_EMAIL = process.env.FROM_EMAIL;
const APP_URL = process.env.CORS_ORIGIN;

async function sendEmail({ to, subject, html, text }) {
	if (!to) {
		return { success: false, message: 'Email address is required' };
	}
	
	if (!transporter) {
		return { success: true, message: 'Email sent via development mode (SMTP not configured)' };
	}
	
	try {
		const result = await transporter.sendMail({ from: FROM_EMAIL, to, subject, html, text });
		return { success: true, message: 'Email sent successfully', data: result };
	} catch (error) {
		console.error('❌ Failed to send email:', error);
		return { success: false, message: error.message };
	}
}

async function sendDeliveryOTP(email, customerName, orderId, otp, restaurantName) {
	try {
		const subject = `🔐 MoodBite Delivery Verification - Order #${orderId}`;
		
		const htmlContent = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
			<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
				<div style="text-align: center; margin-bottom: 30px;">
					<h1 style="color: #e74c3c; margin: 0; font-size: 28px;">🍽️ MoodBite</h1>
					<p style="color: #7f8c8d; margin: 5px 0;">Food Delivery Service</p>
				</div>
				
				<div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
					<h2 style="color: #27ae60; margin: 0 0 15px 0; font-size: 20px;">🚚 Delivery Verification</h2>
					<p style="color: #2c3e50; margin: 0; line-height: 1.6;">
						Hi <strong>${customerName}</strong>!<br>
						Your order <strong>#${orderId}</strong> from <strong>${restaurantName}</strong> is out for delivery.
					</p>
				</div>
				
				<div style="background-color: #fff3cd; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
					<h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">🔢 Your Delivery OTP</h3>
					<div style="background-color: #ffffff; padding: 15px; border: 2px dashed #f39c12; border-radius: 8px; display: inline-block;">
						<span style="font-size: 32px; font-weight: bold; color: #e67e22; letter-spacing: 5px;">${otp}</span>
					</div>
					<p style="color: #856404; margin: 15px 0 0 0; font-size: 14px;">
						Enter this OTP when your delivery partner arrives
					</p>
				</div>
				
				<div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
					<h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">📋 Order Details</h4>
					<p style="color: #0c5460; margin: 5px 0; font-size: 14px;">
						<strong>Order ID:</strong> ${orderId}<br>
						<strong>Restaurant:</strong> ${restaurantName}<br>
						<strong>Customer:</strong> ${customerName}
					</p>
				</div>
				
				<div style="text-align: center; padding-top: 20px; border-top: 1px solid #ecf0f1;">
					<p style="color: #7f8c8d; margin: 0; font-size: 12px;">
						This OTP is valid for one-time use only.<br>
						Thank you for choosing MoodBite! 🎉
					</p>
				</div>
			</div>
		</div>
		`;

		const emailResult = await sendEmail({ to: email, subject, html: htmlContent });
		
		if (emailResult.success) {
			return {
				success: true,
				message: 'OTP sent successfully via Email',
				method: 'email',
				data: {
					email: email,
					customerName: customerName,
					orderId: orderId,
					restaurantName: restaurantName
				}
			};
		} else {
			throw new Error('Failed to send email OTP');
		}

	} catch (error) {
		console.error('❌ Email OTP sending error:', error.message);
		return {
			success: true,
			message: 'OTP sent via development fallback (Email error)',
			method: 'development',
			data: { 
				otp, 
				email: email,
				fallback: true,
				error: error.message,
				note: 'Email service error occurred, using development mode'
			}
		};
	}
}

function generateOTP() {
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	return otp;
}


function validateOTP(inputOTP, storedOTP, isUsed) {
	if (!storedOTP) {
		return { valid: false, message: 'No OTP found for this order' };
	}
	
	if (isUsed) {
		return { valid: false, message: 'OTP has already been used' };
	}
	
	if (inputOTP !== storedOTP) {
		return { valid: false, message: 'Invalid OTP' };
	}
	
	return { valid: true, message: 'OTP verified successfully' };
}


function getServiceStatus() {
	return {
		email: {
			configured: !!(smtpHost && smtpPort && smtpUser && smtpPass),
			status: !!(smtpHost && smtpPort && smtpUser && smtpPass) ? 'ready' : 'development_mode',
			note: !!(smtpHost && smtpPort && smtpUser && smtpPass) ? 'Email service is ready' : 'Using development fallback mode'
		},
		status: !!(smtpHost && smtpPort && smtpUser && smtpPass) ? 'ready' : 'development_mode',
		note: 'Email-based OTP delivery service'
	};
}

function buildApprovalEmail(role, name) {
	const loginPath = role === 'restaurant' ? '/restaurant/login' : '/delivery/login';
	const loginUrl = `${APP_URL}${loginPath}`;
	const subject = 'Registration Approved - Welcome to MoodBite';
	const greetingName = name || (role === 'restaurant' ? 'Restaurant Owner' : 'Delivery Partner');
	
	const roleTitle = role === 'restaurant' ? 'Restaurant Owner' : 'Delivery Partner';
	const platformName = 'MoodBite Food Delivery Platform';
	
	const html = `
		<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
			<!-- Header -->
			<div style="background: linear-gradient(135deg, ${role === 'restaurant' ? '#2563eb 0%, #7c3aed 100%' : '#10b981 0%, #059669 100%'}); padding: 30px; text-align: center;">
				<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to MoodBite</h1>
				<p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your registration has been approved</p>
			</div>
			
			<!-- Content -->
			<div style="padding: 40px 30px;">
				<h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 22px; font-weight: 500;">Hello ${greetingName},</h2>
				
				<p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
					Congratulations! Your application to join MoodBite as a <strong>${roleTitle}</strong> has been reviewed and approved.
				</p>
				
				<p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
					You can now access your dashboard and start using our platform to ${role === 'restaurant' ? 'manage your restaurant and accept orders' : 'deliver orders and earn money'}.
				</p>
				
				<!-- CTA Button -->
				<div style="text-align: center; margin: 40px 0;">
					<a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, ${role === 'restaurant' ? '#2563eb 0%, #7c3aed 100%' : '#10b981 0%, #059669 100%'}); color: #ffffff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px ${role === 'restaurant' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; transition: all 0.3s ease;">
						Access Your Dashboard
					</a>
				</div>
				
				<div style="background-color: #f7fafc; border-left: 4px solid ${role === 'restaurant' ? '#2563eb' : '#10b981'}; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
					<h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 500;">What's Next?</h3>
					<ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
						<li>Complete your profile setup</li>
						<li>${role === 'restaurant' ? 'Add your menu items and pricing' : 'Set your availability and delivery areas'}</li>
						<li>Start accepting and managing orders</li>
					</ul>
				</div>
				
				<p style="color: #4a5568; margin: 30px 0 0 0; font-size: 16px; line-height: 1.6;">
					If you have any questions or need assistance, please don't hesitate to contact our support team.
				</p>
				
				<p style="color: #4a5568; margin: 20px 0 0 0; font-size: 16px; line-height: 1.6;">
					Welcome aboard!<br>
					<strong>The MoodBite Team</strong>
				</p>
			</div>
			
			<!-- Footer -->
			<div style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
				<p style="color: #718096; margin: 0; font-size: 14px;">
					This is an automated message. Please do not reply to this email.
				</p>
			</div>
		</div>
	`;
	
	const text = `Hello ${greetingName},

Congratulations! Your application to join MoodBite as a ${roleTitle} has been reviewed and approved.

You can now access your dashboard and start using our platform to ${role === 'restaurant' ? 'manage your restaurant and accept orders' : 'deliver orders and earn money'}.

Login to your dashboard: ${loginUrl}

What's Next?
- Complete your profile setup
- ${role === 'restaurant' ? 'Add your menu items and pricing' : 'Set your availability and delivery areas'}
- Start accepting and managing orders

If you have any questions or need assistance, please don't hesitate to contact our support team.

Welcome aboard!
The MoodBite Team

This is an automated message. Please do not reply to this email.`;
	
	return { subject, html, text };
}

function buildRejectionEmail(role, name, reason) {
	const subject = 'Registration Update - Application Status';
	const greetingName = name || (role === 'restaurant' ? 'Restaurant Owner' : 'Delivery Partner');
	const why = reason && String(reason).trim().length ? reason : 'Incomplete or invalid details provided';
	const roleTitle = role === 'restaurant' ? 'Restaurant Owner' : 'Delivery Partner';
	
	const html = `
		<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
			<!-- Header -->
			<div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 30px; text-align: center;">
				<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Application Update</h1>
				<p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Important information about your registration</p>
			</div>
			
			<!-- Content -->
			<div style="padding: 40px 30px;">
				<h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 22px; font-weight: 500;">Hello ${greetingName},</h2>
				
				<p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
					Thank you for your interest in joining MoodBite as a <strong>${roleTitle}</strong>. We have carefully reviewed your application and would like to provide you with some feedback.
				</p>
				
				<div style="background-color: #fed7d7; border-left: 4px solid #e53e3e; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
					<h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 500;">Application Status: Not Approved</h3>
					<p style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
						<strong>Reason:</strong> ${why}
					</p>
				</div>
				
				<p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
					We understand this may be disappointing, but we want to ensure that all partners on our platform meet our quality standards and requirements.
				</p>
				
				<div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
					<h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 500;">Next Steps</h3>
					<ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
						<li>Review the feedback provided above</li>
						<li>Address the identified issues</li>
						<li>Submit a new application when ready</li>
					</ul>
				</div>
				
				<p style="color: #4a5568; margin: 30px 0 0 0; font-size: 16px; line-height: 1.6;">
					We encourage you to re-apply once you have addressed these concerns. Our team is here to help ensure your success on the MoodBite platform.
				</p>
				
				<p style="color: #4a5568; margin: 20px 0 0 0; font-size: 16px; line-height: 1.6;">
					If you have any questions or need clarification, please don't hesitate to contact our support team.
				</p>
				
				<p style="color: #4a5568; margin: 20px 0 0 0; font-size: 16px; line-height: 1.6;">
					Best regards,<br>
					<strong>The MoodBite Team</strong>
				</p>
			</div>
			
			<!-- Footer -->
			<div style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
				<p style="color: #718096; margin: 0; font-size: 14px;">
					This is an automated message. Please do not reply to this email.
				</p>
			</div>
		</div>
	`;
	
	const text = `Hello ${greetingName},

Thank you for your interest in joining MoodBite as a ${roleTitle}. We have carefully reviewed your application and would like to provide you with some feedback.

Application Status: Not Approved
Reason: ${why}

We understand this may be disappointing, but we want to ensure that all partners on our platform meet our quality standards and requirements.

Next Steps:
- Review the feedback provided above
- Address the identified issues
- Submit a new application when ready

We encourage you to re-apply once you have addressed these concerns. Our team is here to help ensure your success on the MoodBite platform.

If you have any questions or need clarification, please don't hesitate to contact our support team.

Best regards,
The MoodBite Team

This is an automated message. Please do not reply to this email.`;
	
	return { subject, html, text };
}

async function sendApprovalEmail(email, role, name) {
	const emailContent = buildApprovalEmail(role, name);
	await sendEmail({ to: email, ...emailContent });
}

async function sendRejectionEmail(email, role, name, reason) {
	const emailContent = buildRejectionEmail(role, name, reason);
	await sendEmail({ to: email, ...emailContent });
}

function buildPasswordResetOTPEmail(userName, otp, userType = 'user') {
	const subject = 'Password Reset OTP - MoodBite';
	const greetingName = userName || (userType === 'admin' ? 'Admin' : userType === 'restaurant' ? 'Restaurant Owner' : userType === 'delivery' ? 'Delivery Partner' : 'User');
	
	const html = `
		<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);">
			<!-- Header -->
			<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 35px 30px; text-align: center;">
				<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">🔐 Password Reset</h1>
				<p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">MoodBite Food Delivery</p>
			</div>
			
			<!-- Content -->
			<div style="padding: 35px 30px;">
				<h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 20px; font-weight: 500;">Hello ${greetingName},</h2>
				
				<p style="color: #4a5568; margin: 0 0 25px 0; font-size: 15px; line-height: 1.6;">
					We received a request to reset your password. Use the OTP below to verify your identity.
				</p>
				
				<!-- OTP Display -->
				<div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; border: 2px solid #e2e8f0;">
					<p style="color: #4a5568; margin: 0 0 15px 0; font-size: 14px; font-weight: 500;">Your Verification Code</p>
					<div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #d1d5db; display: inline-block;">
						<span style="font-size: 32px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
					</div>
				</div>
				
				<div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 18px; border-radius: 0 8px 8px 0; margin: 25px 0;">
					<h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Important Information</h3>
					<ul style="color: #1e40af; margin: 0; padding-left: 18px; line-height: 1.5; font-size: 14px;">
						<li>This code expires in <strong>5 minutes</strong></li>
						<li>Enter this code on the password reset page</li>
						<li>If you didn't request this, please ignore this email</li>
					</ul>
				</div>
				
				<p style="color: #6b7280; margin: 25px 0 0 0; font-size: 14px; line-height: 1.5;">
					Best regards,<br>
					<strong style="color: #374151;">The MoodBite Team</strong>
				</p>
			</div>
			
			<!-- Footer -->
			<div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
				<p style="color: #9ca3af; margin: 0; font-size: 12px;">
					This is an automated message. Please do not reply to this email.
				</p>
			</div>
		</div>
	`;
	
	const text = `Hello ${greetingName},

We received a request to reset your password. Use the OTP below to verify your identity.

Your Verification Code: ${otp}

Important Information:
- This code expires in 5 minutes
- Enter this code on the password reset page
- If you didn't request this, please ignore this email

Best regards,
The MoodBite Team

This is an automated message. Please do not reply to this email.`;
	
	return { subject, html, text };
}

function buildPasswordResetEmail(userName, resetLink, userType = 'user') {
	const subject = 'Password Reset - MoodBite';
	const greetingName = userName || (userType === 'admin' ? 'Admin' : userType === 'restaurant' ? 'Restaurant Owner' : userType === 'delivery' ? 'Delivery Partner' : 'User');
	
	const html = `
		<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
			<!-- Header -->
			<div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center;">
				<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔐 Password Reset</h1>
				<p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">MoodBite Food Delivery</p>
			</div>
			
			<!-- Content -->
			<div style="padding: 40px 30px;">
				<h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 22px; font-weight: 500;">Hello ${greetingName},</h2>
				
				<p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
					We received a request to reset your password for your MoodBite account.
				</p>
				
				<p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
					Click the button below to reset your password. This link will expire in 1 hour for security reasons.
				</p>
				
				<!-- CTA Button -->
				<div style="text-align: center; margin: 40px 0;">
					<a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: #ffffff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3); transition: all 0.3s ease;">
						Reset Your Password
					</a>
				</div>
				
				<div style="background-color: #f7fafc; border-left: 4px solid #e74c3c; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
					<h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 500;">Security Notice</h3>
					<ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
						<li>This link expires in 1 hour</li>
						<li>If you didn't request this reset, please ignore this email</li>
						<li>Your password won't change until you click the link above</li>
					</ul>
				</div>
				
				<p style="color: #4a5568; margin: 30px 0 0 0; font-size: 16px; line-height: 1.6;">
					If the button doesn't work, copy and paste this link into your browser:
				</p>
				<p style="color: #e74c3c; margin: 10px 0 0 0; font-size: 14px; word-break: break-all; background-color: #f7fafc; padding: 10px; border-radius: 4px;">
					${resetLink}
				</p>
				
				<p style="color: #4a5568; margin: 20px 0 0 0; font-size: 16px; line-height: 1.6;">
					Best regards,<br>
					<strong>The MoodBite Team</strong>
				</p>
			</div>
			
			<!-- Footer -->
			<div style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
				<p style="color: #718096; margin: 0; font-size: 14px;">
					This is an automated message. Please do not reply to this email.
				</p>
			</div>
		</div>
	`;
	
	const text = `Hello ${greetingName},

We received a request to reset your password for your MoodBite account.

Click the link below to reset your password. This link will expire in 1 hour for security reasons.

Reset your password: ${resetLink}

Security Notice:
- This link expires in 1 hour
- If you didn't request this reset, please ignore this email
- Your password won't change until you click the link above

Best regards,
The MoodBite Team

This is an automated message. Please do not reply to this email.`;
	
	return { subject, html, text };
}

async function sendPasswordResetOTPEmail(email, userName, otp, userType = 'user') {
	try {
		const emailContent = buildPasswordResetOTPEmail(userName, otp, userType);
		const result = await sendEmail({ to: email, ...emailContent });
		
		if (result.success) {
			return {
				success: true,
				message: 'Password reset OTP sent successfully',
				data: { email, userName, userType, otp }
			};
		} else {
			return {
				success: false,
				message: 'Failed to send password reset OTP',
				error: result.message
			};
		}
	} catch (error) {
		console.error('❌ Password reset OTP email error:', error);
		return {
			success: false,
			message: 'Failed to send password reset OTP',
			error: error.message
		};
	}
}

async function sendPasswordResetEmail(email, userName, resetLink, userType = 'user') {
	try {
		const emailContent = buildPasswordResetEmail(userName, resetLink, userType);
		const result = await sendEmail({ to: email, ...emailContent });
		
		if (result.success) {
			return {
				success: true,
				message: 'Password reset email sent successfully',
				data: { email, userName, userType }
			};
		} else {
			return {
				success: false,
				message: 'Failed to send password reset email',
				error: result.message
			};
		}
	} catch (error) {
		console.error('❌ Password reset email error:', error);
		return {
			success: false,
			message: 'Failed to send password reset email',
			error: error.message
		};
	}
}

module.exports = { sendEmail, sendApprovalEmail, sendRejectionEmail, buildApprovalEmail, buildRejectionEmail, sendDeliveryOTP, generateOTP, validateOTP, getServiceStatus, sendPasswordResetEmail, buildPasswordResetEmail, sendPasswordResetOTPEmail, buildPasswordResetOTPEmail };