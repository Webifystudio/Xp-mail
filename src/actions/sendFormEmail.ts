
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
    return { success: false, message: 'Email server not configured.' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your email provider
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  let responseHtml = `<h2>New Submission for Form: ${formTitle}</h2><ul>`;
  for (const [question, answer] of Object.entries(responseData)) {
    responseHtml += `<li><strong>${question}:</strong> ${Array.isArray(answer) ? answer.join(', ') : answer}</li>`;
  }
  responseHtml += '</ul>';

  const mailOptions = {
    from: `"XPMail & Forms" <${emailUser}>`, // Sender address (must be the same as EMAIL_USER for Gmail)
    to: to, // Receiver address
    subject: `New Form Submission: ${formTitle}`,
    html: responseHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Form submission email sent successfully to:', to);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('Failed to send form submission email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending email.';
    return { success: false, message: `Failed to send email: ${errorMessage}` };
  }
}
