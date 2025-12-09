import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
}

interface GoogleDriveResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderId, galleryId } = await req.json();

    if (!folderId || !galleryId) {
      return new Response(
        JSON.stringify({ error: 'Missing folderId or galleryId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch files from Google Drive
    console.log(`Fetching files from folder: ${folderId}`);
    
    let allFiles: GoogleDriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', `'${folderId}' in parents and trashed = false`);
      url.searchParams.set('fields', 'files(id,name,mimeType,thumbnailLink),nextPageToken');
      url.searchParams.set('pageSize', '100');
      url.searchParams.set('key', googleApiKey);
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Drive API error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to access Google Drive folder. Make sure it is publicly shared.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data: GoogleDriveResponse = await response.json();
      allFiles = allFiles.concat(data.files || []);
      pageToken = data.nextPageToken;
    } while (pageToken);

    console.log(`Found ${allFiles.length} files in folder`);

    // Filter for image files (ARW, JPG, etc.)
    const imageExtensions = ['.arw', '.jpg', '.jpeg', '.png', '.cr2', '.nef', '.raf', '.dng'];
    const imageFiles = allFiles.filter(file => {
      const lowerName = file.name.toLowerCase();
      return imageExtensions.some(ext => lowerName.endsWith(ext));
    });

    console.log(`Found ${imageFiles.length} image files`);

    if (imageFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No image files found in the folder' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare photos for insertion
    const photos = imageFiles.map(file => {
      // Google Drive thumbnail URL - get a larger size
      // Format: https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
      let thumbnailUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`;
      
      return {
        gallery_id: galleryId,
        filename: file.name,
        google_file_id: file.id,
        thumbnail_url: thumbnailUrl,
        is_liked: false,
      };
    });

    // Insert photos into database
    const { data: insertedPhotos, error: insertError } = await supabase
      .from('photos')
      .insert(photos)
      .select();

    if (insertError) {
      console.error('Error inserting photos:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save photos to database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully synced ${insertedPhotos?.length || 0} photos`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        photoCount: insertedPhotos?.length || 0,
        message: `Successfully synced ${insertedPhotos?.length || 0} photos`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in sync-google-drive function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
