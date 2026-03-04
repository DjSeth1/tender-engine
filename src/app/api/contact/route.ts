import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

interface ContactPayload {
  name: string;
  company: string;
  email: string;
  sector: string;
  message: string;
}

function getNotionClient(): Client {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error('NOTION_API_KEY is not set');
  return new Client({ auth: apiKey });
}

function getDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error('NOTION_DATABASE_ID is not set');
  return id;
}

export async function POST(request: Request) {
  try {
    const body: ContactPayload = await request.json();
    const { name, company, email, sector, message } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const notion = getNotionClient();
    const databaseId = getDatabaseId();

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: name } }],
        },
        Company: {
          rich_text: [{ text: { content: company ?? '' } }],
        },
        Email: {
          email: email,
        },
        Sector: sector
          ? { select: { name: sector } }
          : { select: null },
        Message: {
          rich_text: [{ text: { content: message ?? '' } }],
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[/api/contact]', err);
    return NextResponse.json(
      { error: 'Failed to save enquiry. Please try again.' },
      { status: 500 }
    );
  }
}
