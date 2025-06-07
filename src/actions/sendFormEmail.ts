
'use server';

import nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  formTitle: string;
  responseData: Record<string, any>;
}

export async function sendFormSubmissionEmail({ to, formTitle, responseData }: EmailPayload): Promise<{ success: boolean; message: string }> {
  // =====================================================================================
  // !!! SECURITY WARNING - TEMPORARY HARDCODED CREDENTIALS !!!
  // These credentials are hardcoded for temporary development convenience AS PER USER REQUEST.
  // THIS IS A MAJOR SECURITY RISK and MUST NOT be used in production or committed to
  // a shared repository with real credentials.
  //
  // TODO: REPLACE THESE WITH ENVIRONMENT VARIABLES IMMEDIATELY!
  // Example using environment variables (recommended):
  // const emailUser = process.env.EMAIL_USER;
  // const emailPass = process.env.EMAIL_PASS;
  // =====================================================================================
  const emailUser = "xpnetwork.tech@gmail.com"; // <<< TEMPORARY - REPLACE WITH process.env.EMAIL_USER
  const emailPass = "luic ekcp dfbh nakd";   // <<< TEMPORARY - REPLACE WITH process.env.EMAIL_PASS

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

  let responseHtml = `<h2>New Submission for Form: ${formTitle}</h2><p>A new response has been submitted to your form.</p><h3>Response Details:</h3><ul>`;
  for (const [question, answer] of Object.entries(responseData)) {
    responseHtml += `<li><strong>${question.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</strong> ${Array.isArray(answer) ? answer.join(', ') : String(answer).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
  }
  responseHtml += '</ul><p>Thank you for using XPMail & Forms.</p>';

  const mailOptions = {
    from: `"XPMail & Forms" <${emailUser}>`, 
    to: to, 
    subject: `New Form Submission: ${formTitle}`,
    html: responseHtml,
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

    