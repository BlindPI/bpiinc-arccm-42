import { supabase } from '@/integrations/supabase/client';

export interface CertificatePaginationDiagnostic {
  totalRecords: number;
  queryPerformance: {
    allRecordsTime: number;
    paginatedTime: number;
    improvement: string;
  };
  filteringAnalysis: {
    clientSideFilterTime: number;
    serverSideFilterTime: number;
    improvement: string;
  };
  sortingCapabilities: {
    currentSorting: string[];
    missingSorting: string[];
  };
  paginationNeeds: {
    recommendedPageSize: number;
    totalPagesNeeded: number;
    memoryImpact: string;
  };
  groupingAnalysis: {
    byUser: number;
    byLocation: number;
    byDate: number;
    byBatchId: number;
  };
}

export async function diagnoseCertificatePagination(userId?: string): Promise<CertificatePaginationDiagnostic> {
  console.log('🔍 Starting Certificate Pagination Diagnostic...');
  
  // **Problem Source 1: Database Query Performance**
  console.log('📊 Testing query performance...');
  
  // Test 1: Current approach - fetch all records
  const allRecordsStart = performance.now();
  const { data: allCertificates, error: allError } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false });
  const allRecordsTime = performance.now() - allRecordsStart;
  
  if (allError) {
    console.error('❌ Error fetching all certificates:', allError);
    throw allError;
  }
  
  const totalRecords = allCertificates?.length || 0;
  console.log(`📈 Found ${totalRecords} total certificates`);
  console.log(`⏱️ Time to fetch all records: ${allRecordsTime.toFixed(2)}ms`);
  
  // Test 2: Paginated approach - fetch first 20 records
  const paginatedStart = performance.now();
  const { data: paginatedCertificates, error: paginatedError } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 19); // First 20 records
  const paginatedTime = performance.now() - paginatedStart;
  
  if (paginatedError) {
    console.error('❌ Error fetching paginated certificates:', paginatedError);
    throw paginatedError;  
  }
  
  console.log(`⏱️ Time to fetch paginated records (20): ${paginatedTime.toFixed(2)}ms`);
  
  // **Problem Source 2: Client-Side vs Server-Side Filtering**
  console.log('🔍 Testing filtering performance...');
  
  // Test 3: Client-side filtering (current approach)
  const clientFilterStart = performance.now();
  const clientFiltered = allCertificates?.filter(cert => 
    cert.recipient_name?.toLowerCase().includes('test') ||
    cert.course_name?.toLowerCase().includes('first aid')
  ) || [];
  const clientSideFilterTime = performance.now() - clientFilterStart;
  
  console.log(`⏱️ Client-side filtering time: ${clientSideFilterTime.toFixed(2)}ms`);
  console.log(`📊 Client-side filtered results: ${clientFiltered.length}`);
  
  // Test 4: Server-side filtering
  const serverFilterStart = performance.now();
  const { data: serverFiltered, error: serverError } = await supabase
    .from('certificates')
    .select('*')
    .or('recipient_name.ilike.%test%,course_name.ilike.%first aid%')
    .order('created_at', { ascending: false })
    .range(0, 19);
  const serverSideFilterTime = performance.now() - serverFilterStart;
  
  if (serverError) {
    console.error('❌ Error with server-side filtering:', serverError);
  }
  
  console.log(`⏱️ Server-side filtering time: ${serverSideFilterTime.toFixed(2)}ms`);
  console.log(`📊 Server-side filtered results: ${serverFiltered?.length || 0}`);
  
  // **Analysis: Grouping Data for Organization**
  console.log('📊 Analyzing grouping potential...');
  
  const groupingAnalysis = {
    byUser: new Set(allCertificates?.map(c => c.user_id).filter(Boolean)).size,
    byLocation: new Set(allCertificates?.map(c => c.location_id).filter(Boolean)).size,
    byDate: new Set(allCertificates?.map(c => c.created_at?.split('T')[0]).filter(Boolean)).size,
    byBatchId: new Set(allCertificates?.map(c => c.batch_id).filter(Boolean)).size,
  };
  
  console.log('📈 Grouping Analysis:', groupingAnalysis);
  
  // **Calculate Improvements**
  const queryImprovement = allRecordsTime > 0 ? 
    `${((allRecordsTime - paginatedTime) / allRecordsTime * 100).toFixed(1)}% faster` : 
    'Unable to calculate';
    
  const filterImprovement = clientSideFilterTime > 0 ? 
    `${((clientSideFilterTime - serverSideFilterTime) / clientSideFilterTime * 100).toFixed(1)}% faster` : 
    'Unable to calculate';
  
  // **Memory Impact Calculation**
  const avgRecordSize = 2; // KB per certificate record (estimated)
  const currentMemoryUsage = totalRecords * avgRecordSize;
  const paginatedMemoryUsage = 20 * avgRecordSize;
  const memoryImprovement = `${((currentMemoryUsage - paginatedMemoryUsage) / currentMemoryUsage * 100).toFixed(1)}% reduction`;
  
  const diagnostic: CertificatePaginationDiagnostic = {
    totalRecords,
    queryPerformance: {
      allRecordsTime: Math.round(allRecordsTime),
      paginatedTime: Math.round(paginatedTime),
      improvement: queryImprovement,
    },
    filteringAnalysis: {
      clientSideFilterTime: Math.round(clientSideFilterTime),
      serverSideFilterTime: Math.round(serverSideFilterTime),
      improvement: filterImprovement,
    },
    sortingCapabilities: {
      currentSorting: ['created_at desc'],
      missingSorting: ['recipient_name', 'course_name', 'location_id', 'batch_id', 'status', 'issue_date', 'expiry_date'],
    },
    paginationNeeds: {
      recommendedPageSize: Math.min(20, Math.max(10, Math.ceil(totalRecords / 20))),
      totalPagesNeeded: Math.ceil(totalRecords / 20),
      memoryImpact: memoryImprovement,
    },
    groupingAnalysis,
  };
  
  console.log('✅ Certificate Pagination Diagnostic Complete');
  return diagnostic;
}

export function logCertificatePaginationDiagnostic(diagnostic: CertificatePaginationDiagnostic) {
  console.log('\n🔍 CERTIFICATE PAGINATION DIAGNOSTIC RESULTS');
  console.log('==========================================');
  
  console.log(`📊 Total Records: ${diagnostic.totalRecords}`);
  console.log(`⚡ Query Performance:`);
  console.log(`   - All records: ${diagnostic.queryPerformance.allRecordsTime}ms`);
  console.log(`   - Paginated (20): ${diagnostic.queryPerformance.paginatedTime}ms`);
  console.log(`   - Improvement: ${diagnostic.queryPerformance.improvement}`);
  
  console.log(`🔍 Filtering Analysis:`);
  console.log(`   - Client-side: ${diagnostic.filteringAnalysis.clientSideFilterTime}ms`);
  console.log(`   - Server-side: ${diagnostic.filteringAnalysis.serverSideFilterTime}ms`);
  console.log(`   - Improvement: ${diagnostic.filteringAnalysis.improvement}`);
  
  console.log(`📈 Sorting Capabilities:`);
  console.log(`   - Current: ${diagnostic.sortingCapabilities.currentSorting.join(', ')}`);
  console.log(`   - Missing: ${diagnostic.sortingCapabilities.missingSorting.join(', ')}`);
  
  console.log(`📄 Pagination Needs:`);
  console.log(`   - Recommended page size: ${diagnostic.paginationNeeds.recommendedPageSize}`);
  console.log(`   - Total pages needed: ${diagnostic.paginationNeeds.totalPagesNeeded}`);
  console.log(`   - Memory impact: ${diagnostic.paginationNeeds.memoryImpact}`);
  
  console.log(`🏷️ Grouping Analysis:`);
  console.log(`   - Unique users: ${diagnostic.groupingAnalysis.byUser}`);
  console.log(`   - Unique locations: ${diagnostic.groupingAnalysis.byLocation}`);
  console.log(`   - Unique dates: ${diagnostic.groupingAnalysis.byDate}`);
  console.log(`   - Unique batch IDs: ${diagnostic.groupingAnalysis.byBatchId}`);
  
  console.log('\n🎯 TOP ISSUES IDENTIFIED:');
  
  if (diagnostic.queryPerformance.allRecordsTime > 100) {
    console.log('❌ CRITICAL: Query performance is poor - fetching all records takes too long');
  }
  
  if (diagnostic.totalRecords > 50) {
    console.log('❌ CRITICAL: No pagination implemented - loading too many records at once');
  }
  
  if (diagnostic.filteringAnalysis.clientSideFilterTime > 10) {
    console.log('❌ MAJOR: Client-side filtering is inefficient - should be server-side');
  }
  
  if (diagnostic.sortingCapabilities.missingSorting.length > 5) {
    console.log('❌ MAJOR: Missing essential sorting options for user experience');
  }
  
  if (diagnostic.groupingAnalysis.byUser > 10 || diagnostic.groupingAnalysis.byLocation > 5) {
    console.log('❌ MODERATE: Data organization could benefit from grouping features');
  }
  
  console.log('\n==========================================');
}