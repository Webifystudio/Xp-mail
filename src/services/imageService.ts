
'use server';
/**
 * @fileOverview Service function for uploading images to ImgBB.
 * IMPORTANT: In a production environment, the API key should not be exposed
 * on the client-side. This function should be moved to a secure backend
 * (e.g., a Firebase Cloud Function) to protect the API key.
 */

interface ImgBBResponseData {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime:string;
      extension: string;
      url: string;
    };
    medium?: { // Medium might not always be present
      filename: string;
      name: string;
      mime:string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export async function uploadToImgBB(
  apiKey: string,
  imageFile: File
): Promise<string> {
  if (!apiKey) {
    throw new Error('ImgBB API key is required.');
  }
  if (!imageFile) {
    throw new Error('Image file is required.');
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ImgBB API Error:', errorData);
      throw new Error(`Failed to upload image to ImgBB. Status: ${response.status}. Message: ${errorData?.error?.message || 'Unknown error'}`);
    }

    const result: ImgBBResponseData = await response.json();

    if (result.success && result.data.url) {
      return result.data.display_url || result.data.url; // Prefer display_url if available
    } else {
      console.error('ImgBB Upload Failed:', result);
      throw new Error('ImgBB did not return a success status or image URL.');
    }
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during image upload.');
  }
}
