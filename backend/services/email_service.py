"""
Email service for sending assignment notifications and other emails.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from pathlib import Path
import logging

from core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails using SMTP."""
    
    def __init__(self):
        self.smtp_server = settings.EMAIL_SMTP
        self.smtp_port = settings.EMAIL_PORT
        self.email_user = settings.EMAIL_USER
        self.email_pass = settings.EMAIL_PASS
        self.from_name = settings.EMAIL_FROM_NAME
    
    def _validate_config(self) -> bool:
        """Check if email configuration is available."""
        if not self.email_user or not self.email_pass:
            print("\n❌ EMAIL ERROR: Missing credentials")
            print(f"   EMAIL_USER: {'✓ Set' if self.email_user else '✗ Missing'}")
            print(f"   EMAIL_PASS: {'✓ Set' if self.email_pass else '✗ Missing'}")
            logger.warning("Email credentials not configured. Email will not be sent.")
            return False
        print(f"\n✓ Email config validated (from: {self.email_user})")
        return True
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        plain_text: Optional[str] = None
    ) -> bool:
        """
        Send an email using SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            plain_text: Optional plain text version (fallback)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self._validate_config():
            return False
        
        print(f"\n📧 SENDING EMAIL")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   SMTP: {self.smtp_server}:{self.smtp_port}")
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.email_user}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add plain text part (fallback)
            if plain_text:
                part1 = MIMEText(plain_text, 'plain')
                msg.attach(part1)
            
            # Add HTML part
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            print("   Connecting to SMTP server...")
            # Send email
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                print("   Authenticating...")
                server.login(self.email_user, self.email_pass)
                print("   Sending message...")
                server.send_message(msg)
            
            print(f"   ✅ Email sent successfully!\n")
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            print(f"   ❌ SMTP Authentication Error: {str(e)}")
            print("   Check your EMAIL_USER and EMAIL_PASS in .env file")
            print("   For Gmail, you need an App Password, not your regular password\n")
            logger.error(f"SMTP Auth failed for {to_email}: {str(e)}")
            return False
        except smtplib.SMTPException as e:
            print(f"   ❌ SMTP Error: {str(e)}\n")
            logger.error(f"SMTP error sending to {to_email}: {str(e)}")
            return False
        except Exception as e:
            print(f"   ❌ Unexpected Error: {str(e)}\n")
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_assignment_email(
        self,
        to_email: str,
        candidate_name: str,
        job_title: str,
        company: str,
        task_title: str,
        task_description: str,
        time_limit: int,
        deadline: str,
        requirements: list[str],
        evaluation_criteria: list[str],
        interview_link: str,
        additional_resources: Optional[str] = None
    ) -> bool:
        """
        Send assignment notification email to candidate.
        
        Args:
            to_email: Candidate email
            candidate_name: Candidate's full name
            job_title: Job position title
            company: Company name
            task_title: Assignment task title
            task_description: Detailed task description
            time_limit: Time limit in hours
            deadline: Formatted deadline string
            requirements: List of task requirements
            evaluation_criteria: List of evaluation criteria
            interview_link: Link to interview session
            additional_resources: Optional additional resources/notes
            
        Returns:
            True if email sent successfully
        """
        # Load HTML template
        template_path = Path(__file__).parent.parent / "templates" / "assignment_email.html"
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                html_template = f.read()
        except FileNotFoundError:
            logger.error(f"Email template not found at {template_path}")
            return False
        
        # Replace placeholders in template (handle None values)
        html_content = html_template.replace('{{candidate_name}}', candidate_name or 'Candidate')
        html_content = html_content.replace('{{job_title}}', job_title or 'Position')
        html_content = html_content.replace('{{company}}', company or 'OpenAI')
        html_content = html_content.replace('{{task_title}}', task_title or 'Technical Assignment')
        html_content = html_content.replace('{{task_description}}', task_description or '')
        html_content = html_content.replace('{{time_limit}}', str(time_limit))
        html_content = html_content.replace('{{deadline}}', deadline or 'TBD')
        html_content = html_content.replace('{{interview_link}}', interview_link)
        
        # Build requirements list HTML
        requirements_html = '\n'.join([f'<li>{req}</li>' for req in requirements])
        html_content = html_content.replace('{{requirements}}', requirements_html)
        
        # Build evaluation criteria HTML
        criteria_html = '\n'.join([f'<li>{criteria}</li>' for criteria in evaluation_criteria])
        html_content = html_content.replace('{{evaluation_criteria}}', criteria_html)
        
        # Add additional resources if provided
        if additional_resources:
            resources_html = f'''
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #495057;">📚 Additional Resources:</p>
                <p style="margin: 10px 0 0 0; color: #495057;">{additional_resources}</p>
            </div>
            '''
            html_content = html_content.replace('{{additional_resources}}', resources_html)
        else:
            html_content = html_content.replace('{{additional_resources}}', '')
        
        # Create plain text version
        plain_text = f"""
Dear {candidate_name},

Congratulations! We'd like to move forward with your application for {job_title} at {company}.

Assignment: {task_title}
Time Limit: {time_limit} hours
Deadline: {deadline}

{task_description}

Requirements:
{chr(10).join(['- ' + req for req in requirements])}

Evaluation Criteria:
{chr(10).join(['- ' + criteria for criteria in evaluation_criteria])}

{'Additional Resources: ' + additional_resources if additional_resources else ''}

Interview Link: {interview_link}

Good luck!

Best regards,
Engval.ai Team
        """
        
        subject = f"Technical Assignment - {job_title} at {company}"
        
        return self.send_email(to_email, subject, html_content, plain_text)


# Global email service instance
email_service = EmailService()
