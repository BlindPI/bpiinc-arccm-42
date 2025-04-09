
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

    // Check if there's an admin user
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    
    if (!userId) {
      throw new Error("Unauthorized: You must be authenticated to upload templates");
    }
    
    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    if (!profile || !['SA', 'AD'].includes(profile.role)) {
      throw new Error("Unauthorized: Only administrators can upload templates");
    }

    const { templateType, fileBase64, fileName } = await req.json();
    
    if (!templateType || !fileBase64 || !fileName) {
      throw new Error("Missing required parameters: templateType, fileBase64, and fileName are required");
    }
    
    let bucketId;
    switch (templateType) {
      case 'certificate':
        bucketId = 'certificate_template';
        break;
      case 'roster':
        bucketId = 'roster_template';
        break;
      default:
        throw new Error("Invalid template type. Must be 'certificate' or 'roster'");
    }
    
    // Convert base64 to file
    const binaryData = Uint8Array.from(atob(fileBase64.split(',')[1]), c => c.charCodeAt(0));
    
    // Upload to the appropriate bucket
    const { error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(fileName, binaryData, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketId)
      .getPublicUrl(fileName);

    // Create a notification for admins about the template upload
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['SA', 'AD']);
        
      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'INFO',
          title: 'Template Uploaded',
          message: `A new ${templateType} template "${fileName}" has been uploaded.`,
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
        message: `${templateType} template uploaded successfully`,
        url: publicUrl
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    console.error("Error uploading template:", error);
    
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
