
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if there's an authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Unauthorized: Missing authorization header");
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized: Invalid token");
    }
    
    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    if (!profile || !['SA', 'AD'].includes(profile.role)) {
      throw new Error("Unauthorized: Only administrators can manage fonts");
    }

    const body = await req.json();
    
    // Check if this is a bucket creation request
    if (body.action === 'create-bucket') {
      const bucketName = body.bucketName || 'fonts';
      
      // Try to create the bucket
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(
        bucketName,
        {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ['font/ttf', 'font/otf', 'application/octet-stream', 'application/x-font-ttf', 'application/x-font-otf']
        }
      );
      
      if (bucketError && !bucketError.message.includes('already exists')) {
        throw bucketError;
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: bucketError ? `Bucket ${bucketName} already exists` : `Bucket ${bucketName} created successfully`,
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }
    
    // Handle font upload
    const { fontName, fileBase64 } = body;
    
    if (!fontName || !fileBase64) {
      throw new Error("Missing required parameters: fontName and fileBase64 are required");
    }
    
    // Convert base64 to file
    const binaryData = Uint8Array.from(atob(fileBase64.split(',')[1]), c => c.charCodeAt(0));
    
    // Upload to the fonts bucket
    const bucketId = body.bucketId || 'fonts';
    const { error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(fontName, binaryData, {
        contentType: 'font/ttf',
        upsert: true
      });
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketId)
      .getPublicUrl(fontName);
    
    // Create a notification for admins about the font upload
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['SA', 'AD']);
        
      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'INFO',
          title: 'Font Uploaded',
          message: `A new font "${fontName}" has been uploaded for certificates.`,
          read: false
        }));
        
        await supabase.from('notifications').insert(notifications);
      }
    } catch (notificationError) {
      console.error("Error creating notifications:", notificationError);
      // Don't throw here, just log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Font ${fontName} uploaded successfully to ${bucketId}`,
        url: publicUrlData?.publicUrl
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    console.error("Error in upload-fonts function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
