/**
 * Email Service
 * Simulated Gmail integration for sending automated reminders.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  customerName?: string;
}

export async function sendGmailReminder(payload: EmailPayload) {
  // In a production environment, this would use nodemailer or a Gmail API.
  // For this implementation, we simulate the delay and log the success.
  
  console.log('--- GMAIL OUTBOX ---');
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`Body: ${payload.body}`);
  console.log('--------------------');

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    success: true,
    messageId: `sim_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
}
