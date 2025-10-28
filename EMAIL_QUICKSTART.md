# Quick Start - Email Confirmation Feature

## 🚀 Get Started in 3 Steps

### Step 1: Configure Email (5 minutes)

**For Gmail Users (Recommended):**

1. **Create/Copy .env file:**
   ```powershell
   copy .env.example .env
   ```

2. **Generate Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Enable 2-Step Verification if not already enabled
   - Create new App Password for "Mail"
   - Copy the 16-character password

3. **Edit .env file with your details:**
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SENDER_EMAIL=your-email@gmail.com
   SENDER_PASSWORD=xxxx xxxx xxxx xxxx
   SENDER_NAME=Your Organization Name
   ```

4. **Set environment variables in PowerShell:**
   ```powershell
   $env:SMTP_SERVER="smtp.gmail.com"
   $env:SMTP_PORT="587"
   $env:SENDER_EMAIL="your-email@gmail.com"
   $env:SENDER_PASSWORD="your-app-password"
   $env:SENDER_NAME="Your Organization"
   ```

### Step 2: Test Configuration (2 minutes)

Run the test script:
```powershell
python test_email_config.py
```

Enter your email address when prompted. If successful, you'll receive a test email!

### Step 3: Start Using! (Immediate)

1. Start your Flask application
2. Go to any raffle's buyer list
3. Check the "Payment Received" checkbox for a buyer
4. Dialog appears: "Would you like to send a payment confirmation email?"
5. Click OK to send!

## 📧 What Gets Sent

The buyer receives a professional email with:
- ✅ Thank you message
- 🎫 All their ticket numbers
- 💰 Amount paid
- 🏆 Prize details
- 📅 Draw date

## ⚠️ Troubleshooting

**Email not configured error?**
- Make sure environment variables are set
- Restart Flask app after setting variables

**Authentication failed?**
- Use App Password for Gmail (not regular password)
- Check email and password are correct

**Email not received?**
- Check spam/junk folder
- Verify buyer's email address

## 📚 Need More Help?

- **Detailed Setup:** See `EMAIL_SETUP.md`
- **Implementation Details:** See `EMAIL_IMPLEMENTATION.md`
- **Configuration Template:** See `.env.example`

## 🎯 Optional: Skip Email

If you don't want to send an email:
- Just click "Cancel" when prompted
- Payment status will still be updated
- No email will be sent

That's it! You're ready to send professional payment confirmations! 🎉
