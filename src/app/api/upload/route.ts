import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload.' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 files allowed.' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    // 3. Process each file
    for (const file of files) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 2MB size limit.` },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a supported format. Please upload JPG, PNG, or WEBP.` },
          { status: 400 }
        );
      }

      // Generate unique name to prevent collisions
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // Convert file to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase bucket 'listings'
      const { data, error } = await supabaseAdmin.storage
        .from('listings')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error details:', error);
        return NextResponse.json(
          { error: `Failed to upload image "${file.name}" to storage.` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('listings')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        return NextResponse.json(
          { error: `Failed to retrieve public URL for uploaded image "${file.name}".` },
          { status: 500 }
        );
      }

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'Images uploaded successfully.',
      urls: uploadedUrls,
    });
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
