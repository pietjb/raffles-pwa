# Email Configuration Setup Guide

## Overview
The raffle system can now send automated payment confirmation emails to buyers when their payment is marked as received. This feature helps provide professional communication and improves the buyer experience.

## What Gets Sent
When a payment is marked as received and you choose to send an email, the buyer receives:
- ✅ Payment confirmation and thank you message
- 🎫 All their ticket numbers
- 💰 Total amount paid
- 🏆 Prize details
- 📅 Draw date
- Professional HTML-formatted email with branding

## Setup Instructions

### Step 1: Copy Environment File
```bash
copy .env.example .env
```

### Step 2: Configure Email Settings

#### For Gmail (Recommended for Testing)

1. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password generated

3. **Update .env file**
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SENDER_EMAIL=your-email@gmail.com
   SENDER_PASSWORD=xxxx xxxx xxxx xxxx
   SENDER_NAME=Your Raffle Organization
   ```

#### For Other Email Providers

**Outlook/Hotmail:**
```
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SENDER_EMAIL=your-email@outlook.com
SENDER_PASSWORD=your-password
SENDER_NAME=Your Raffle Organization
```

**Yahoo Mail:**
```
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
SENDER_EMAIL=your-email@yahoo.com
SENDER_PASSWORD=your-app-password
SENDER_NAME=Your Raffle Organization
```

**Custom SMTP Server:**
```
SMTP_SERVER=mail.yourdomain.com
SMTP_PORT=587
SENDER_EMAIL=noreply@yourdomain.com
SENDER_PASSWORD=your-smtp-password
SENDER_NAME=Your Organization
```

### Step 3: Install Required Package (if needed)
The email functionality uses Python's built-in `smtplib` library, so no additional packages are required.

### Step 4: Set Environment Variables

**Windows (PowerShell):**
```powershell
$env:SMTP_SERVER="smtp.gmail.com"
$env:SMTP_PORT="587"
$env:SENDER_EMAIL="your-email@gmail.com"
$env:SENDER_PASSWORD="your-app-password"
$env:SENDER_NAME="Your Raffle Organization"
```

**Windows (Command Prompt):**
```cmd
set SMTP_SERVER=smtp.gmail.com
set SMTP_PORT=587
set SENDER_EMAIL=your-email@gmail.com
set SENDER_PASSWORD=your-app-password
set SENDER_NAME=Your Raffle Organization
```

**Linux/Mac:**
```bash
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SENDER_EMAIL="your-email@gmail.com"
export SENDER_PASSWORD="your-app-password"
export SENDER_NAME="Your Raffle Organization"
```

### Step 5: Test the Configuration
1. Start your Flask application
2. Mark a test buyer's payment as received
3. Choose "Yes" when prompted to send confirmation email
4. Check if the email was sent successfully

## Usage

### Sending Payment Confirmation
1. Go to the Buyers section of a raffle
2. Find the buyer whose payment you've received
3. Check the "Payment Received" checkbox
4. A dialog will appear asking if you want to send a confirmation email
5. Click "OK" to send the email, or "Cancel" to skip

### Email Content
The confirmation email includes:
- Personalized greeting with buyer's name
- Raffle name and details
- Number of tickets purchased
- Complete list of ticket numbers
- Total amount paid
- Prize description
- Draw date (formatted nicely)
- Professional HTML formatting with colors and styling

## Troubleshooting

### "Email not configured" Error
- Make sure environment variables are set
- Restart your Flask application after setting variables
- Verify the `.env` file exists and contains correct values

### Authentication Failed
- For Gmail: Use App Password, not regular password
- Verify email and password are correct
- Check if 2-Step Verification is enabled (required for Gmail)
- Try generating a new App Password

### Email Not Received
- Check spam/junk folder
- Verify buyer's email address is correct
- Check Flask console for error messages
- Ensure SMTP server and port are correct

### "SMTP Connection Error"
- Check your internet connection
- Verify SMTP server address and port
- Some networks block port 587; try port 465 (SSL) instead
- Check firewall settings

## Security Best Practices

1. **Never commit .env file to version control**
   - Add `.env` to your `.gitignore` file
   
2. **Use App Passwords**
   - Never use your actual email password
   - Generate app-specific passwords when possible

3. **Limit Access**
   - Only give email credentials to trusted administrators
   - Use a dedicated email account for the raffle system

4. **Production Deployment**
   - Use environment variables provided by your hosting platform
   - Don't store credentials in code or config files
   - Consider using environment secrets management

## Optional: Load from .env File

To automatically load environment variables from `.env` file, you can use `python-dotenv`:

```bash
pip install python-dotenv
```

Then add to the top of `app.py`:
```python
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
```

This is already included in your `requirements.txt` file.

## Support

If you encounter issues:
1. Check the Flask console for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Check email provider's SMTP documentation
5. Ensure email account allows "less secure apps" or use App Passwords

## Features

- ✅ Professional HTML email templates
- ✅ Plain text fallback for compatibility
- ✅ Personalized content for each buyer
- ✅ Formatted ticket numbers and amounts
- ✅ Beautiful styling with colors and emojis
- ✅ Automatic date formatting
- ✅ Error handling and user feedback
- ✅ Optional - only sends when requested
