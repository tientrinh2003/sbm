import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const note = formData.get('note') as string || '';
    const type = formData.get('type') as string || 'monitoring';

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'photos');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
    const extension = photo.name.split('.').pop() || 'jpg';
    const filename = `${session.user.email.replace('@', '_at_')}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await photo.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Save to database (optional - if you have a photos table)
    try {
      // Example: If you want to save photo metadata to database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (user) {
        // You could create a photos table and save metadata here
        console.log('Photo saved for user:', user.id);
        console.log('Photo path:', `/uploads/photos/${filename}`);
        console.log('Note:', note);
        console.log('Type:', type);
        
        // Example: Create photo record (uncomment if you have photos table)
        /*
        await prisma.photo.create({
          data: {
            userId: user.id,
            filename: filename,
            path: `/uploads/photos/${filename}`,
            note: note,
            type: type,
            createdAt: new Date()
          }
        });
        */
      }
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Continue even if DB save fails
    }

    return NextResponse.json({
      success: true,
      filename: filename,
      path: `/uploads/photos/${filename}`,
      message: 'Photo uploaded successfully'
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' }, 
      { status: 500 }
    );
  }
}