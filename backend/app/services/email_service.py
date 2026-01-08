# ============================================================================
# FILE: backend/app/services/email_service.py
# ============================================================================
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


# Email templates in multiple languages
EMAIL_TEMPLATES = {
    "en": {
        "subject": "Password Reset Request - Prayer Tracker",
        "body": """
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #00A86B; margin: 0;">🕌 Prayer Tracker</h1>
                </div>
                
                <h2 style="color: #333;">Hello {name},</h2>
                
                <p style="color: #666; line-height: 1.6;">
                    We received a request to reset your password. Use the code below to reset your password:
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <p style="color: #888; margin: 0 0 10px 0; font-size: 14px;">Your Reset Code:</p>
                    <p style="font-size: 32px; font-weight: bold; color: #00A86B; letter-spacing: 3px; margin: 0;">
                        {reset_token}
                    </p>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                    This code will expire in <strong>15 minutes</strong>.
                </p>
                
                <p style="color: #666; line-height: 1.6;">
                    If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        This is an automated message, please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
    },
    "tr": {
        "subject": "Şifre Sıfırlama İsteği - Namaz Takip",
        "body": """
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #00A86B; margin: 0;">🕌 Namaz Takip</h1>
                </div>
                
                <h2 style="color: #333;">Merhaba {name},</h2>
                
                <p style="color: #666; line-height: 1.6;">
                    Şifrenizi sıfırlamak için bir istek aldık. Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <p style="color: #888; margin: 0 0 10px 0; font-size: 14px;">Sıfırlama Kodunuz:</p>
                    <p style="font-size: 32px; font-weight: bold; color: #00A86B; letter-spacing: 3px; margin: 0;">
                        {reset_token}
                    </p>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                    Bu kod <strong>15 dakika</strong> içinde geçerliliğini yitirecektir.
                </p>
                
                <p style="color: #666; line-height: 1.6;">
                    Eğer şifre sıfırlama isteğinde bulunmadıysanız, bu e-postayı görmezden gelebilir veya endişeleriniz varsa destek ekibimizle iletişime geçebilirsiniz.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        Bu otomatik bir mesajdır, lütfen bu e-postayı yanıtlamayın.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
    },
    "ar": {
        "subject": "طلب إعادة تعيين كلمة المرور - متتبع الصلاة",
        "body": """
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; direction: rtl;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #00A86B; margin: 0;">🕌 متتبع الصلاة</h1>
                </div>
                
                <h2 style="color: #333;">مرحباً {name}،</h2>
                
                <p style="color: #666; line-height: 1.6;">
                    تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. استخدم الرمز أدناه لإعادة تعيين كلمة المرور:
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <p style="color: #888; margin: 0 0 10px 0; font-size: 14px;">رمز إعادة التعيين:</p>
                    <p style="font-size: 32px; font-weight: bold; color: #00A86B; letter-spacing: 3px; margin: 0;">
                        {reset_token}
                    </p>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                    سينتهي صلاحية هذا الرمز خلال <strong>15 دقيقة</strong>.
                </p>
                
                <p style="color: #666; line-height: 1.6;">
                    إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني أو الاتصال بالدعم إذا كانت لديك مخاوف.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        هذه رسالة تلقائية، يرجى عدم الرد على هذا البريد الإلكتروني.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
    }
}


async def send_password_reset_email(
    email: str,
    name: str,
    reset_token: str,
    language: str = "en"
) -> bool:
    """
    Send password reset email with reset token.
    
    Args:
        email: Recipient email address
        name: User's name
        reset_token: Password reset token
        language: Email language (en, tr, ar)
        
    Returns:
        bool: True if email sent successfully
    """
    try:
        # Get template for language (fallback to English)
        template = EMAIL_TEMPLATES.get(language, EMAIL_TEMPLATES["en"])
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = email
        msg['Subject'] = template["subject"]
        
        # Format email body
        html_body = template["body"].format(
            name=name,
            reset_token=reset_token
        )
        
        # Attach HTML body
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        if settings.EMAIL_ENABLED:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Password reset email sent to: {email}")
            return True
        else:
            # Development mode - just log the token
            logger.info(f"[DEV MODE] Password reset token for {email}: {reset_token}")
            return True
            
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        return False


async def send_password_changed_notification(
    email: str,
    name: str,
    language: str = "en"
) -> bool:
    """
    Send notification that password was successfully changed.
    """
    # Similar structure - implement if needed
    pass