import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { template: string } }
) {
  const template = params.template;
  
  // Validate template name to prevent directory traversal
  if (!template.match(/^[a-z_]+_template\.csv$/)) {
    return NextResponse.json(
      { error: 'Invalid template name' },
      { status: 400 }
    );
  }
  
  // Define the path to templates
  const templatePath = path.join(process.cwd(), 'src', 'data', 'templates', template);
  
  try {
    // Check if the template exists
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Read the template file
    const content = fs.readFileSync(templatePath, 'utf-8');
    
    // Return the template as a CSV file
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${template}"`,
      },
    });
  } catch (error) {
    console.error('Error serving template:', error);
    return NextResponse.json(
      { error: 'Failed to serve template' },
      { status: 500 }
    );
  }
} 