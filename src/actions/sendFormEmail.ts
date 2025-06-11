
'use server';

import nodemailer from 'nodemailer';
import type { Question } from '@/app/forms/create/page'; // Import Question type

interface EmailPayload {
  to: string;
  formTitle: string;
  responseData: Record<string, any>;
  questions: Question[]; // Add questions array
}

export async function sendFormSubmissionEmail({ to, formTitle, responseData, questions }: EmailPayload): Promise<{ success: boolean; message: string }> {
  const emailUser = "xpnetwork.tech@gmail.com"; 
  const emailPass = "pcyg voia ikrt humw"; 

  if (!emailUser || !emailPass) {
    console.error('[sendFormSubmissionEmail] Email credentials are not configured.');
    return { success: false, message: 'Email server not configured.' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  // Create a map for easy lookup of question text by ID
  const questionTextMap = new Map<string, string>();
  questions.forEach(q => {
    if (q.id) { // q.id should always be present
      questionTextMap.set(q.id, q.text);
    } else {
      // Fallback for older data or if ID is somehow missing
      // This case should ideally not happen with current form saving logic
      questionTextMap.set(q.text, q.text); 
    }
  });

  let questionsAndAnswersHtml = '';
  if (Object.keys(responseData).length > 0) {
    for (const [questionId, answer] of Object.entries(responseData)) {
      const questionActualText = questionTextMap.get(questionId) || questionId; // Use ID as fallback
      
      // Sanitize to prevent HTML injection FROM THE CONTENT, not to break the table structure
      const sanitizedQuestion = String(questionActualText).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const sanitizedAnswer = Array.isArray(answer) 
        ? answer.map(a => String(a).replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(', ') 
        : String(answer).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      questionsAndAnswersHtml += `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #444; background-color: #2d2d2d; vertical-align: top; width: 35%; color: #e0e0e0; font-weight: bold;">${sanitizedQuestion}</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #444; vertical-align: top; color: #c7c7c7;">${sanitizedAnswer}</td>
        </tr>
      `;
    }
  } else {
    questionsAndAnswersHtml = `<tr><td colspan="2" style="padding: 15px; border-bottom: 1px solid #444; text-align: center; color: #aaa;">No questions were answered or the form was empty.</td></tr>`;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Form Submission: ${formTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; 
          margin: 0; 
          padding: 0; 
          background-color: #1a1a1a; /* Dark background for the email body */
          color: #f0f0f0; 
          -webkit-font-smoothing: antialiased; 
          -moz-osx-font-smoothing: grayscale; 
        }
        .email-container { 
          max-width: 680px; 
          margin: 25px auto; 
          background-color: #252525; /* Dark card background */
          border-radius: 8px; 
          box-shadow: 0 6px 20px rgba(0,0,0,0.25); 
          overflow: hidden; 
          border: 1px solid #383838; 
        }
        .email-header { 
          background-color: #087f5b; /* Green header */
          color: #ffffff; 
          padding: 30px; 
          text-align: center; 
          border-bottom: 4px solid #0ca678; /* Darker green border */
        }
        .email-header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600; 
        }
        .email-content { 
          padding: 30px; 
        }
        .email-content p { 
          line-height: 1.7; 
          margin: 0 0 18px 0; 
          font-size: 16px; 
          color: #d0d0d0;
        }
        .email-content strong { 
          color: #96f2d7; /* Light green for emphasis */
        }
        .form-data-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 25px; 
          table-layout: fixed; 
        }
        .form-data-table th {
          background-color: #333; /* Darker header for table */
          color: #f0f0f0;
          padding: 14px 15px;
          border-bottom: 2px solid #4a4a4a;
          font-weight: 600;
          text-align: left;
        }
        /* Question/Answer rows styled directly in questionsAndAnswersHtml for robust client compatibility */
        .footer { 
          background-color: #202020; 
          color: #999999; 
          padding: 25px 30px; 
          text-align: center; 
          font-size: 13px; 
          border-top: 1px solid #383838; 
        }
        .footer a { 
          color: #20c997; /* Green link in footer */
          text-decoration: none; 
        }
        .footer a:hover {
          text-decoration: underline;
        }
        @media screen and (max-width: 600px) {
          .email-container { width: 95% !important; margin: 15px auto !important; }
          .email-header h1 { font-size: 24px; }
          .email-content { padding: 20px; }
          .form-data-table td, .form-data-table th { font-size: 14px; padding: 10px 12px;}
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
          <p style="margin-top: 35px;">Thank you for using our service!</p>
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
    console.log('[sendFormSubmissionEmail] Form submission email sent successfully to:', to, 'Message ID:', info.messageId);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('[sendFormSubmissionEmail] Failed to send form submission email. Error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending email.';
    return { success: false, message: `Failed to send email: ${errorMessage}` };
  }
}
