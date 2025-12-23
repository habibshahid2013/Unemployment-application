import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, to, subject, body: emailBody, attachmentName, attachmentData } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated with Gmail' }, { status: 401 });
    }

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Build MIME message
    let message: string;
    
    if (attachmentData && attachmentName) {
      // Email with attachment
      const boundary = 'boundary_' + Date.now();
      message = [
        `From: me`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        emailBody,
        ``,
        `--${boundary}`,
        `Content-Type: application/octet-stream; name="${attachmentName}"`,
        `Content-Disposition: attachment; filename="${attachmentName}"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        attachmentData,
        `--${boundary}--`,
      ].join('\r\n');
    } else {
      // Simple email without attachment
      message = [
        `From: me`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        emailBody,
      ].join('\r\n');
    }

    // Encode as base64url
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gmail API error:', error);
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: error.error?.message || 'Unknown error' 
      }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({ 
      success: true, 
      messageId: result.id,
      threadId: result.threadId 
    });

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
