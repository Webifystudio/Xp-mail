
'use server';

import nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  formTitle: string;
  responseData: Record<string, any>;
}

export async function sendFormSubmissionEmail({ to, formTitle, responseData }: EmailPayload): Promise<{ success: boolean; message: string }> {
  // IMPORTANT: THESE ARE HARDCODED CREDENTIALS FOR DEMONSTRATION.
  // REPLACE WITH ENVIRONMENT VARIABLES (process.env.EMAIL_USER, process.env.EMAIL_PASS) IN PRODUCTION.
  const emailUser = "xpnetwork.tech@gmail.com"; 
  const emailPass = "pcyg voia ikrt humw"; // UPDATED - MUST BE REPLACED WITH ENV VARS FOR PRODUCTION  

  if (!emailUser || !emailPass) {
    console.error('Email credentials (EMAIL_USER, EMAIL_PASS) are not configured. If you see this, the hardcoded values were removed without replacing them with environment variables.');
    return { success: false, message: 'Email server not configured. Hardcoded credentials missing or process.env not set.' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  let questionsAndAnswersHtml = '';
  if (Object.keys(responseData).length > 0) {
    for (const [question, answer] of Object.entries(responseData)) {
      // Sanitize to prevent HTML injection
      const sanitizedQuestion = String(question).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const sanitizedAnswer = Array.isArray(answer) 
        ? answer.map(a => String(a).replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(', ') 
        : String(answer).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      questionsAndAnswersHtml += `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; font-weight: bold; background-color: #f9f9f9; vertical-align: top; width: 35%; color: #333333;">${sanitizedQuestion}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; vertical-align: top; color: #555555;">${sanitizedAnswer}</td>
        </tr>
      `;
    }
  } else {
    questionsAndAnswersHtml = `<tr><td colspan="2" style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center; color: #777777;">No questions were answered or the form was empty.</td></tr>`;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Form Submission: ${formTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 0; padding: 0; background-color: #f4f7f6; color: #333333; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .email-container { max-width: 680px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.07); overflow: hidden; border: 1px solid #dddddd; }
        .email-header { background-color: #4A90E2; /* Consider your app's primary color */ color: #ffffff; padding: 25px 30px; text-align: center; border-bottom: 4px solid #3a7bc8; }
        .email-header h1 { margin: 0; font-size: 26px; font-weight: 600; }
        .email-content { padding: 25px 30px; }
        .email-content p { line-height: 1.65; margin: 0 0 15px 0; font-size: 16px; }
        .email-content strong { color: #2c3e50; }
        .form-data-table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
        .form-data-table th, .form-data-table td { text-align: left; font-size: 15px; }
        .form-data-table th {
          background-color: #eaf2f8; /* Light blueish gray for header */
          color: #34495e;
          padding: 12px;
          border-bottom: 2px solid #d5e5f0;
          font-weight: 600;
        }
        /* Question/Answer rows handled by inline styles in questionsAndAnswersHtml for better client compatibility */
        .footer { background-color: #f0f2f5; color: #888888; padding: 20px 30px; text-align: center; font-size: 13px; border-top: 1px solid #e1e4e8; }
        .footer a { color: #4A90E2; text-decoration: none; }
        @media screen and (max-width: 600px) {
          .email-container { width: 95% !important; margin: 10px auto !important; }
          .email-header h1 { font-size: 22px; }
          .email-content { padding: 20px; }
          .form-data-table td, .form-data-table th { font-size: 14px; padding: 8px 10px;}
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>New Form Submission</h1>
        </div>
        <div class="email-content">
          <p>Hello,</p>
          <p>You've received a new submission for your form: <strong>${formTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong>.</p>
          <p>Below are the details of the response:</p>
          <table class="form-data-table">
            <thead>
              <tr>
                <th style="width: 35%;">Question</th>
                <th>Answer</th>
              </tr>
            </thead>
            <tbody>
              ${questionsAndAnswersHtml}
            </tbody>
          </table>
          <p style="margin-top: 30px;">Thank you for using our service!</p>
        </div>
        <div class="footer">
          Powered by <a href="#">XPMail & Forms</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"XPMail & Forms" <${emailUser}>`, 
    to: to, 
    subject: `New Form Submission: ${formTitle}`,
    html: emailHtml,
  };

  try {
    console.log(`[sendFormSubmissionEmail] Attempting to send email to: ${to} from: ${emailUser} for form: ${formTitle}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Form submission email sent successfully to:', to, 'Message ID:', info.messageId);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('[sendFormSubmissionEmail] Failed to send form submission email. Error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending email.';
    return { success: false, message: `Failed to send email: ${errorMessage}` };
  }
}

