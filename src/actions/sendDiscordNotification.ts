
'use server';

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
  responseData: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl) {
    return { success: false, message: 'Discord webhook URL is not configured.' };
  }

  const fields: DiscordEmbedField[] = [];
  for (const [question, answer] of Object.entries(responseData)) {
    fields.push({
      name: question.substring(0, 256), // Max field name length is 256
      value: (Array.isArray(answer) ? answer.join(', ') : String(answer)).substring(0, 1024), // Max field value length is 1024
      inline: false, // Display each Q&A on its own line for clarity
    });
  }
  
  // Split fields into multiple embeds if there are too many (Discord limit is 25 fields per embed)
  const embeds: DiscordEmbed[] = [];
  const maxFieldsPerEmbed = 20; // Keep it under 25 to be safe with title/description/footer
  for (let i = 0; i < fields.length; i += maxFieldsPerEmbed) {
    const chunk = fields.slice(i, i + maxFieldsPerEmbed);
    const embed: DiscordEmbed = {
      title: i === 0 ? `New Submission: ${formTitle.substring(0, 250)}` : `(continued) ${formTitle.substring(0,240)}`,
      color: 0x5865F2, // Discord blurple
      fields: chunk,
      timestamp: new Date().toISOString(),
    };
    if (i === 0) {
         embed.description = `A new response has been submitted to your form.`;
    }
    if (i + maxFieldsPerEmbed >= fields.length) { // Add footer to the last embed
        embed.footer = { text: 'Powered by XPMail & Forms' };
    }
    embeds.push(embed);
  }
  
  if (embeds.length === 0) { // Case where responseData is empty
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
    // You can set a default avatar URL if you have one hosted
    // avatar_url: "https://your-app.com/avatar.png", 
    embeds: embeds.slice(0, 10), // Discord allows max 10 embeds per message
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
