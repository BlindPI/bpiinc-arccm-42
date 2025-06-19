// Debug script to validate certificate request batch data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://seaxchrsbldrppupupbw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYXhjaHJzYmxkcnBwdXB1cGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTUyMDMsImV4cCI6MjA1OTc5MTIwM30._3sOX2_EkBFp4mzC0_MjBkAlAHxHWitsMShszmLITOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCertificateRequests() {
  console.log('🔍 Debugging Certificate Requests Batch Grouping...\n');
  
  try {
    // Fetch pending certificate requests
    const { data: requests, error } = await supabase
      .from('certificate_requests')
      .select('id, recipient_name, batch_id, batch_name, created_at, status')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching requests:', error);
      return;
    }

    console.log(`📊 Found ${requests?.length || 0} pending certificate requests\n`);

    if (!requests || requests.length === 0) {
      console.log('ℹ️  No pending requests found');
      return;
    }

    // Analyze batch data
    const withBatch = requests.filter(r => r.batch_id && r.batch_name);
    const withoutBatch = requests.filter(r => !r.batch_id || !r.batch_name);

    console.log(`📦 Requests with batch info: ${withBatch.length}`);
    console.log(`📄 Individual requests: ${withoutBatch.length}\n`);

    // Group by batch
    const batches = new Map();
    withBatch.forEach(request => {
      if (!batches.has(request.batch_id)) {
        batches.set(request.batch_id, {
          batch_id: request.batch_id,
          batch_name: request.batch_name,
          requests: []
        });
      }
      batches.get(request.batch_id).requests.push(request);
    });

    console.log('🔢 Batch Analysis:');
    if (batches.size > 0) {
      batches.forEach((batch, batchId) => {
        console.log(`  - Batch: "${batch.batch_name}" (${batch.requests.length} requests)`);
      });
    } else {
      console.log('  - No batched requests found');
    }

    console.log('\n📋 Individual Requests:');
    withoutBatch.forEach(request => {
      console.log(`  - ${request.recipient_name} (ID: ${request.id})`);
    });

    console.log('\n✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugCertificateRequests();