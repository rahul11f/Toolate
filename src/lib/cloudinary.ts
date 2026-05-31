import crypto from 'crypto';

export async function uploadToCloudinary(fileBuffer: Buffer, fileType: string): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('[CLOUDINARY] Credentials not fully configured in environment.');
    return null;
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'toolate_listings';
    
    // Sort parameters alphabetically for signature signing
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign)
      .digest('hex');

    const base64Data = fileBuffer.toString('base64');
    const fileUri = `data:${fileType};base64,${base64Data}`;

    const formData = new FormData();
    formData.append('file', fileUri);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('[CLOUDINARY] Upload error response:', errorData);
      return null;
    }

    const data = await res.json();
    console.log('[CLOUDINARY] Image successfully uploaded to Cloudinary:', data.secure_url);
    return data.secure_url || data.url || null;
  } catch (err) {
    console.error('[CLOUDINARY] Failed to upload image buffer to Cloudinary:', err);
    return null;
  }
}
