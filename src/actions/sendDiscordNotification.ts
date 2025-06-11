
'use server';

import type { Question } from '@/app/forms/create/page'; // Import Question type

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number; // Hex color code as an integer
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string; // ISO8601 timestamp
}

interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export async function sendDiscordNotification(
  webhookUrl: string,
  formTitle: string,
  responseData: Record<string, any>,
  questions: Question[] // Add questions array
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl) {
    return { success: false, message: 'Discord webhook URL is not configured.' };
  }

  // Create a map for easy lookup of question text by ID
  const questionTextMap = new Map<string, string>();
  questions.forEach(q => {
    if (q.id) { // q.id should always be present
      questionTextMap.set(q.id, q.text);
    } else {
      // Fallback for older data or if ID is somehow missing
      questionTextMap.set(q.text, q.text);
    }
  });
  
  const fields: DiscordEmbedField[] = [];
  for (const [questionId, answer] of Object.entries(responseData)) {
    const questionActualText = questionTextMap.get(questionId) || questionId; // Use ID as fallback

    fields.push({
      name: String(questionActualText).substring(0, 256), // Max field name length is 256
      value: (Array.isArray(answer) ? answer.join(', ') : String(answer)).substring(0, 1024), // Max field value length is 1024
      inline: false, // Display each Q&A on its own line for clarity
    });
  }
  
  const embeds: DiscordEmbed[] = [];
  const maxFieldsPerEmbed = 20; 
  for (let i = 0; i < fields.length; i += maxFieldsPerEmbed) {
    const chunk = fields.slice(i, i + maxFieldsPerEmbed);
    const embed: DiscordEmbed = {
      title: i === 0 ? `New Submission: ${formTitle.substring(0, 250)}` : `(continued) ${formTitle.substring(0,240)}`,
      color: 0x5865F2, 
      fields: chunk,
      timestamp: new Date().toISOString(),
    };
    if (i === 0) {
         embed.description = `A new response has been submitted to your form.`;
    }
    if (i + maxFieldsPerEmbed >= fields.length) { 
        embed.footer = { text: 'Powered by XPMail & Forms' };
    }
    embeds.push(embed);
  }
  
  if (embeds.length === 0) { 
     embeds.push({
        title: `New Submission: ${formTitle.substring(0, 250)}`,
        description: "A new response (with no questions/answers) has been submitted.",
        color: 0x5865F2,
        timestamp: new Date().toISOString(),
        footer: { text: 'Powered by XPMail & Forms' }
     });
  }

  const payload: DiscordWebhookPayload = {
    username: 'XPMail & Forms Notifier',
    embeds: embeds.slice(0, 10), 
  };

  try {
    console.log('[sendDiscordNotification] Attempting to send notification to Discord webhook.');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[sendDiscordNotification] Discord API Error (${response.status}): ${errorBody}`);
      return { success: false, message: `Failed to send Discord notification. Status: ${response.status}. Response: ${errorBody}` };
    }

    console.log('[sendDiscordNotification] Discord notification sent successfully.');
    return { success: true, message: 'Discord notification sent successfully.' };
  } catch (error) {
    console.error('[sendDiscordNotification] Failed to send Discord notification. Error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending Discord notification.';
    return { success: false, message: `Failed to send Discord notification: ${errorMessage}` };
  }
}
