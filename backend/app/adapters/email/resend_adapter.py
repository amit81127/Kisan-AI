import logging
import re
import socket
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status
import resend
from app.core.config import settings

logger = logging.getLogger("kisanrakshak.email")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class ResendEmailAdapter:
    """
    Adapter for Resend Email API and SMTP delivery.
    Delivers 6-digit verification codes to the user's actual registered email address.
    Supports custom domain authentication (no-reply@kisanai.com).
    Never hardcodes or reroutes recipient addresses.
    """

    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL or "KisanRakshak AI <no-reply@kisanai.com>"
        if self.api_key:
            resend.api_key = self.api_key
            logger.info("Resend Email Adapter initialized with configured API Key.")
        else:
            logger.warning("RESEND_API_KEY is not configured in settings.")

    @staticmethod
    def _mask_email(email: str) -> str:
        """Mask email address for privacy in application logs (e.g. th***@gmail.com)."""
        if not email or "@" not in email:
            return "***"
        parts = email.split("@")
        user = parts[0]
        domain = parts[1]
        masked_user = (user[:2] + "***") if len(user) > 2 else (user[:1] + "***")
        return f"{masked_user}@{domain}"

    async def check_domain_status(self, domain_name: str = "kisanai.com") -> Dict[str, Any]:
        """
        Query Resend API to inspect the live verification status and DNS records
        for the custom domain kisanai.com.
        """
        if not self.api_key:
            return {
                "error": "RESEND_API_KEY is not configured",
                "is_verified": False,
                "status": "unconfigured"
            }

        try:
            domains_resp = resend.Domains.list()
            domains_list = domains_resp.get("data", []) if isinstance(domains_resp, dict) else getattr(domains_resp, "data", [])
            
            target_domain = None
            for d in domains_list:
                d_dict = d if isinstance(d, dict) else d.__dict__
                if d_dict.get("name") == domain_name:
                    target_domain = d_dict
                    break

            if not target_domain:
                return {
                    "domain": domain_name,
                    "status": "not_found",
                    "is_verified": False,
                    "message": f"Domain {domain_name} has not been registered in Resend."
                }

            domain_id = target_domain.get("id")
            # Fetch detailed record breakdown
            domain_details = resend.Domains.get(domain_id)
            det_dict = domain_details if isinstance(domain_details, dict) else domain_details.__dict__

            raw_status = det_dict.get("status", "pending")
            records = det_dict.get("records", [])

            # Format DNS records clearly
            formatted_records = []
            for rec in records:
                r_dict = rec if isinstance(rec, dict) else rec.__dict__
                formatted_records.append({
                    "record_type": r_dict.get("record"),  # DKIM / SPF
                    "type": r_dict.get("type"),            # TXT / CNAME
                    "name": r_dict.get("name"),            # host
                    "value": r_dict.get("value"),          # target value
                    "status": r_dict.get("status"),        # pending / verified
                    "ttl": r_dict.get("ttl", "Auto")
                })

            is_verified = raw_status == "verified"

            return {
                "domain": domain_name,
                "id": domain_id,
                "status": raw_status,
                "region": det_dict.get("region", "ap-northeast-1"),
                "is_verified": is_verified,
                "records": formatted_records,
                "dmarc_recommendation": {
                    "record_type": "DMARC",
                    "type": "TXT",
                    "name": "_dmarc",
                    "value": "v=DMARC1; p=none;",
                    "ttl": "Auto",
                    "note": "Recommended best practice for inbox placement and domain protection"
                },
                "next_steps": (
                    "Your domain is fully verified and active for sending." if is_verified
                    else (
                        f"Domain '{domain_name}' verification is currently {raw_status.upper()}. "
                        "To complete verification, add the DKIM (TXT) and SPF (CNAME) records listed above "
                        "into your DNS manager (e.g. Cloudflare, GoDaddy, Namecheap), then click 'Verify' in Resend."
                    )
                )
            }
        except Exception as e:
            logger.error(f"Error checking Resend domain status: {e}")
            return {
                "domain": domain_name,
                "status": "error",
                "is_verified": False,
                "error": str(e)
            }

    def _render_otp_html(self, otp_code: str, farmer_name: str, target_email: str) -> str:
        """
        Render a responsive, production-ready HTML email template with
        KisanRakshak AI branding, 6-digit OTP, 5-minute expiry notice, and security warnings.
        """
        display_name = farmer_name.strip() if farmer_name and farmer_name.strip() else "Farmer Friend"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KisanRakshak AI — Verification Code</title>
  <style>
    @media only screen and (max-width: 600px) {{
      .content-wrapper {{ padding: 24px 16px !important; }}
      .otp-display {{ font-size: 32px !important; letter-spacing: 8px !important; }}
      .brand-title {{ font-size: 22px !important; }}
    }}
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f2; margin: 0; padding: 28px 12px; color: #102419;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(16, 36, 25, 0.08); border: 1px solid #dce6de;">
    
    <!-- Brand Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0e2719 0%, #173d27 100%); padding: 36px 24px; text-align: center;">
        <div style="display: inline-block; background-color: #22c55e; border-radius: 14px; padding: 10px 14px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">
          <span style="font-size: 24px; color: #0e2719;">🌾</span>
        </div>
        <h1 class="brand-title" style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
          Kisan<span style="color: #4ade80;">Rakshak</span> AI
        </h1>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 0.2px;">
          Autonomous Multimodal Crop Doctor & Farmer Portal
        </p>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td class="content-wrapper" style="padding: 40px 36px;">
        <h2 style="font-size: 20px; color: #0e2719; margin-top: 0; margin-bottom: 12px; font-weight: 700;">
          Namaste, {display_name}!
        </h2>
        <p style="color: #334155; line-height: 1.6; font-size: 15px; margin: 0 0 20px 0;">
          We received an authentication request for <strong style="color: #0e2719;">{target_email}</strong>. Use the 6-digit verification code below to securely sign in to your KisanRakshak account:
        </p>

        <!-- Prominent 6-Digit OTP Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 16px; margin: 26px 0; text-align: center;">
          <tr>
            <td style="padding: 26px 20px;">
              <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; color: #15803d; display: block; margin-bottom: 10px;">
                Your 6-Digit Login Code
              </span>
              <div class="otp-display" style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #0e2719; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; display: inline-block; padding: 4px 12px; text-indent: 12px;">
                {otp_code}
              </div>
              <p style="margin: 12px 0 0 0; font-size: 13px; color: #166534; font-weight: 600;">
                ⏱️ Valid for 5 minutes only (केवल 5 मिनट के लिए मान्य)
              </p>
            </td>
          </tr>
        </table>

        <!-- Security Notice -->
        <div style="background-color: #fefce8; border: 1px solid #fef08a; border-left: 4px solid #eab308; border-radius: 10px; padding: 14px 16px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px; color: #713f12; line-height: 1.5;">
            🔒 <strong>Security Warning:</strong> Never share this verification code with anyone. KisanRakshak staff will never ask for your code via phone, chat, or email. If you did not request this login, please ignore this email.
          </p>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
          Happy farming,<br>
          <strong style="color: #0e2719;">KisanRakshak AI Support Team</strong><br>
          <span style="color: #15803d; font-size: 12px; font-weight: 600;">kisanai.com</span>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 22px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
          © 2026 KisanRakshak AI • Verified Autonomous Agricultural Intelligence
        </p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
          This automated security notification was sent to {target_email}. Please do not reply directly to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""

    def _render_otp_text(self, otp_code: str, farmer_name: str, target_email: str) -> str:
        """Render plain text fallback for accessibility and deliverability."""
        display_name = farmer_name.strip() if farmer_name and farmer_name.strip() else "Farmer Friend"
        return f"""Namaste, {display_name}!

Your KisanRakshak AI verification code is: {otp_code}

This code is valid for 5 minutes only (केवल 5 मिनट के लिए मान्य).

Security Warning: Never share this code with anyone. KisanRakshak staff will never ask for your verification code. If you did not request this code, you can safely ignore this email.

Happy farming,
KisanRakshak AI Support Team
kisanai.com
"""

    def _send_via_smtp(self, to_email: str, subject: str, html_content: str, text_content: str) -> Dict[str, Any]:
        """Send email via configured fallback SMTP server."""
        host = settings.SMTP_HOST
        port = settings.SMTP_PORT or 587
        user = settings.SMTP_USER
        password = settings.SMTP_PASSWORD
        from_email = settings.SMTP_FROM_EMAIL or user

        if not host or not user or not password:
            raise ValueError("SMTP credentials not configured.")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=12) as server:
                server.login(user, password)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=12) as server:
                server.starttls()
                server.login(user, password)
                server.sendmail(from_email, [to_email], msg.as_string())

        masked = self._mask_email(to_email)
        logger.info(f"OTP successfully delivered via SMTP to {masked}")
        return {
            "success": True,
            "delivered_to": to_email,
            "provider": "smtp"
        }

    async def validate_startup_configuration(self) -> Dict[str, Any]:
        """
        Validate Resend configuration at application startup and log status clearly.
        Checks API key validity and domain verification state.
        """
        if not self.api_key:
            logger.warning("[EMAIL SERVICE] RESEND_API_KEY is not set. Outbound email verification will fail.")
            return {"configured": False, "reason": "missing_api_key"}

        sender_domain = "kisanai.com"
        if "@" in self.from_email:
            sender_domain = self.from_email.split("@")[-1].replace(">", "").strip()

        domain_info = await self.check_domain_status(sender_domain)
        status_val = domain_info.get("status", "unknown")
        is_verified = domain_info.get("is_verified", False)

        if is_verified:
            logger.info(f"[EMAIL SERVICE] Resend sender domain '{sender_domain}' is VERIFIED and active.")
        else:
            logger.warning(
                f"[EMAIL SERVICE] Resend sender domain '{sender_domain}' status is '{status_val.upper()}'. "
                f"DNS verification (DKIM/SPF) is pending. OTP delivery from '{self.from_email}' will return "
                "HTTP 503 Service Unavailable until DNS records propagate in your domain registrar."
            )
        return {
            "configured": True,
            "domain": sender_domain,
            "status": status_val,
            "is_verified": is_verified
        }

    async def send_verification_otp(
        self,
        to_email: str,
        otp_code: str,
        farmer_name: str = "Farmer Friend",
        phone: Optional[str] = None,
        from_email_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send verification OTP email directly to the user's actual registered email address.
        Uses the custom domain sender (e.g. KisanRakshak AI <no-reply@kisanai.com>).
        Handles Resend API unverified domain, invalid keys, timeouts, and rate limits.
        """
        clean_email = to_email.strip().lower() if to_email else ""
        if not clean_email or not EMAIL_REGEX.match(clean_email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a valid recipient email address."
            )

        sender = from_email_override or self.from_email
        masked_email = self._mask_email(clean_email)
        subject = f"KisanRakshak AI — Your Login Verification Code: {otp_code}"
        html_content = self._render_otp_html(
            otp_code=otp_code,
            farmer_name=farmer_name,
            target_email=clean_email
        )
        text_content = self._render_otp_text(
            otp_code=otp_code,
            farmer_name=farmer_name,
            target_email=clean_email
        )

        # 1. Fallback: If SMTP is configured, attempt SMTP delivery first
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                return self._send_via_smtp(clean_email, subject, html_content, text_content)
            except Exception as smtp_err:
                logger.warning(f"SMTP delivery to {masked_email} failed: {smtp_err}. Falling back to Resend API...")

        # 2. Resend API delivery
        if not self.api_key:
            logger.error("RESEND_API_KEY is not configured in settings.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Email delivery service is not configured. Please set RESEND_API_KEY in backend/.env."
            )

        try:
            params: resend.Emails.SendParams = {
                "from": sender,
                "to": [clean_email],
                "subject": subject,
                "html": html_content,
                "text": text_content,
            }
            response = resend.Emails.send(params)
            email_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", None)
            logger.info(f"Resend email dispatched successfully from '{sender}' to {masked_email}. Email ID: {email_id}")
            return {
                "success": True,
                "delivered_to": clean_email,
                "email_id": email_id,
                "provider": "resend",
                "from_email": sender
            }
        except Exception as e:
            err_msg = str(e)
            logger.error(f"Resend API dispatch to {masked_email} failed: {err_msg}")

            # Case A: Unverified sender domain in Resend
            # IMPORTANT: This is an upstream email delivery configuration error, NOT a client authorization failure.
            # Must return HTTP 503 Service Unavailable, NEVER HTTP 403 Forbidden.
            if "domain is not verified" in err_msg.lower() or "not verified" in err_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        f"Email delivery service unavailable: Sender domain '{sender}' is pending DNS verification in Resend. "
                        "Please configure the required DKIM and SPF DNS records for kisanai.com in your domain provider "
                        "(check /api/v1/auth/domain-status for record details), or verify your domain at https://resend.com/domains."
                    )
                )

            # Case B: Resend sandbox restriction on free test domain
            if "only send testing emails to your own email address" in err_msg.lower() or "validation_error" in err_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        f"Email delivery service restricted: The free test domain (onboarding@resend.dev) can only send emails "
                        f"to the Resend account owner's email address. To send to '{clean_email}', verify your custom domain "
                        f"kisanai.com at https://resend.com/domains."
                    )
                )

            # Case C: Invalid or unauthorized API key
            if "unauthorized" in err_msg.lower() or "invalid api key" in err_msg.lower() or "401" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Email delivery failed: Resend API key is invalid or unauthorized. Please verify RESEND_API_KEY in backend/.env."
                )

            # Case D: Rate limit exceeded
            if "rate_limit" in err_msg.lower() or "429" in err_msg or "too many requests" in err_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Resend email rate limit reached. Please wait a few moments before requesting a new verification code."
                )

            # Case E: Network timeout or connection drop
            if "timeout" in err_msg.lower() or isinstance(e, (socket.timeout, TimeoutError)):
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Email dispatch timed out while connecting to Resend. Please try again."
                )

            # Generic fallback (502 Bad Gateway)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Upstream email delivery failed via Resend: {err_msg}"
            )


resend_adapter = ResendEmailAdapter()
