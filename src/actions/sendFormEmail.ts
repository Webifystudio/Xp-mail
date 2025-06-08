
'use server';

import nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  formTitle: string;
  responseData: Record<string, any>;
}

export async function sendFormSubmissionEmail({ to, formTitle, responseData }: EmailPayload): Promise<{ success: boolean; message: string }> {
  const emailUser = "xpnetwork.tech@gmail.com"; 
  const emailPass = "luic ekcp dfbh nakd";   

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
      const sanitizedQuestion = question.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const sanitizedAnswer = Array.isArray(answer) 
        ? answer.map(a => String(a).replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(', ') 
        : String(answer).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      questionsAndAnswersHtml += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9; vertical-align: top; width: 30%;">${sanitizedQuestion}</td>
          <td style="padding: 8px; border: 1px solid #ddd; vertical-align: top;">${sanitizedAnswer}</td>
        </tr>
      `;
    }
  } else {
    questionsAndAnswersHtml = `<tr><td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: center;">No questions were answered or the form was empty.</td></tr>`;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Form Submission: ${formTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background-color: #4A90E2; /* A pleasant blue */ color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .content p { line-height: 1.6; }
        .form-data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .form-data-table th, .form-data-table td { text-align: left; }
        .footer { background-color: #f0f0f0; color: #777; padding: 15px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Form Submission</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You've received a new submission for your form: <strong>${formTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong>.</p>
          <p>Below are the details of the response:</p>
          <table class="form-data-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="padding: 10px; border: 1px solid #ddd; background-color: #e9ecef; text-align: left;">Question</th>
                <th style="padding: 10px; border: 1px solid #ddd; background-color: #e9ecef; text-align: left;">Answer</th>
              </tr>
            </thead>
            <tbody>
              ${questionsAndAnswersHtml}
            </tbody>
          </table>
          <p style="margin-top: 25px;">Thank you for using our service!</p>
        </div>
        <div class="footer">
          Powered by XPMail & Forms
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
