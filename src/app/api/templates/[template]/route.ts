import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { template: string } }
) {
  try {
    const templateName = params.template;
    const templatePath = path.join(process.cwd(), 'public/templates', templateName);
    
    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      return new NextResponse('Template not found', { status: 404 });
    }
    
    // Read file content
    const fileContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Return the file with correct content type
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${templateName}"`,
      },
    });
  } catch (error) {
    console.error('Error serving template:', error);
    return new NextResponse('Error serving template', { status: 500 });
  }
} 