"""
Email Configuration Test Script

This script helps you test your email configuration before using it in the raffle system.
It will attempt to send a test email using your configured SMTP settings.

Usage:
    python test_email_config.py

Make sure to set your environment variables or create a .env file before running.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_email_configuration():
    """Test the email configuration by sending a test email"""
    
    print("=" * 60)
    print("EMAIL CONFIGURATION TEST")
    print("=" * 60)
    print()
    
    # Get configuration
    smtp_server = os.environ.get('SMTP_SERVER', '')
    smtp_port = os.environ.get('SMTP_PORT', '')
    sender_email = os.environ.get('SENDER_EMAIL', '')
    sender_password = os.environ.get('SENDER_PASSWORD', '')
    sender_name = os.environ.get('SENDER_NAME', 'Raffle System')
    
    # Validate configuration
    print("📋 Configuration Check:")
    print(f"   SMTP Server: {smtp_server or '❌ NOT SET'}")
    print(f"   SMTP Port: {smtp_port or '❌ NOT SET'}")
    print(f"   Sender Email: {sender_email or '❌ NOT SET'}")
    print(f"   Sender Password: {'✓ SET' if sender_password else '❌ NOT SET'}")
    print(f"   Sender Name: {sender_name}")
    print()
    
    if not all([smtp_server, smtp_port, sender_email, sender_password]):
        print("❌ ERROR: Missing configuration!")
        print()
        print("Please set the following environment variables:")
        if not smtp_server:
            print("   - SMTP_SERVER")
        if not smtp_port:
            print("   - SMTP_PORT")
        if not sender_email:
            print("   - SENDER_EMAIL")
        if not sender_password:
            print("   - SENDER_PASSWORD")
        print()
        print("Or create a .env file with these values.")
        print("See .env.example for a template.")
        return False
    
    # Ask for test recipient
    test_recipient = input("📧 Enter email address to send test email to: ").strip()
    
    if not test_recipient:
        print("❌ No recipient email provided. Test cancelled.")
        return False
    
    print()
    print("📤 Attempting to send test email...")
    print()
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{sender_name} <{sender_email}>"
        msg['To'] = test_recipient
        msg['Subject'] = "Test Email - Raffle System Configuration"
        
        # Create email body
        text_body = f"""
This is a test email from your Raffle System.

If you're receiving this email, your email configuration is working correctly!

Configuration Details:
- SMTP Server: {smtp_server}
- SMTP Port: {smtp_port}
- Sender Email: {sender_email}
- Sender Name: {sender_name}

You can now use the payment confirmation email feature in your raffle system.

Best regards,
{sender_name}
"""
        
        html_body = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .success {{ background: #c6f6d5; border: 2px solid #48bb78; padding: 15px; 
                              border-radius: 8px; margin: 15px 0; }}
                    .info-box {{ background: white; padding: 15px; border-radius: 8px; 
                               margin: 15px 0; border-left: 4px solid #667eea; }}
                    h1 {{ margin: 0; font-size: 28px; }}
                    .emoji {{ font-size: 1.5em; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1><span class="emoji">✉️</span> Test Email</h1>
                        <p>Raffle System Configuration</p>
                    </div>
                    <div class="content">
                        <div class="success">
                            <p style="margin: 0;"><strong>✅ Success!</strong></p>
                            <p style="margin: 10px 0 0 0;">If you're receiving this email, your email configuration is working correctly!</p>
                        </div>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0;">Configuration Details</h3>
                            <p><strong>SMTP Server:</strong> {smtp_server}</p>
                            <p><strong>SMTP Port:</strong> {smtp_port}</p>
                            <p><strong>Sender Email:</strong> {sender_email}</p>
                            <p><strong>Sender Name:</strong> {sender_name}</p>
                        </div>
                        
                        <p>You can now use the payment confirmation email feature in your raffle system.</p>
                        
                        <p>Best regards,<br>
                        <strong>{sender_name}</strong></p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Attach both versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.starttls()
            print("🔐 Authenticating...")
            server.login(sender_email, sender_password)
            print("📨 Sending email...")
            server.send_message(msg)
        
        print()
        print("=" * 60)
        print("✅ SUCCESS! Test email sent successfully!")
        print("=" * 60)
        print()
        print(f"Check the inbox of {test_recipient}")
        print("(Don't forget to check spam/junk folder)")
        print()
        print("Your email configuration is working correctly!")
        print("You can now use the payment confirmation feature.")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print()
        print("=" * 60)
        print("❌ AUTHENTICATION FAILED")
        print("=" * 60)
        print()
        print("Error:", str(e))
        print()
        print("Possible solutions:")
        print("1. Check that SENDER_EMAIL is correct")
        print("2. Check that SENDER_PASSWORD is correct")
        print("3. For Gmail: Use an App Password (not your regular password)")
        print("   - Enable 2-Step Verification")
        print("   - Generate App Password at: https://myaccount.google.com/apppasswords")
        print("4. For other providers: Check if you need to enable 'less secure apps'")
        return False
        
    except smtplib.SMTPException as e:
        print()
        print("=" * 60)
        print("❌ SMTP ERROR")
        print("=" * 60)
        print()
        print("Error:", str(e))
        print()
        print("Possible solutions:")
        print("1. Check SMTP_SERVER is correct for your email provider")
        print("2. Check SMTP_PORT (usually 587 for TLS)")
        print("3. Check your internet connection")
        print("4. Check if firewall is blocking the connection")
        return False
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ ERROR")
        print("=" * 60)
        print()
        print("Error:", str(e))
        print()
        print("Please check your configuration and try again.")
        return False

if __name__ == "__main__":
    try:
        test_email_configuration()
    except KeyboardInterrupt:
        print()
        print("Test cancelled by user.")
