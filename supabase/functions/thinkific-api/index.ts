import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface ThinkificRequest {
  action: 'getEnrollment' | 'getAssessments' | 'getAssessmentResults' | 'getCourse' | 'getStudentData' | 'syncScores' | 'getAllStudents' | 'getAllEnrollments' | 'getAllCourses'
  email?: string
  courseId?: string
  enrollmentId?: string
  assessmentId?: string
  userIds?: string[]
  page?: number
  per_page?: number
}

interface ThinkificEnrollment {
  id: number
  user_id: number
  course_id: number
  percentage_completed: number
  completed_at: string | null
  started_at: string
  activated_at: string
}

interface ThinkificAssessment {
  id: number
  name: string
  course_id: number
  lesson_id: number
  assessment_type: string
  passing_score: number
  max_attempts: number
}

interface ThinkificAssessmentResult {
  id: number
  assessment_id: number
  user_id: number
  score: number
  passed: boolean
  completed_at: string
  attempt_number: number
}

interface ThinkificCourse {
  id: number
  name: string
  slug: string
  description: string
  status: string
}

interface ThinkificUser {
  id: number
  email: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
  roles: string[]
}

interface BulkDataResponse {
  users?: ThinkificUser[]
  enrollments?: ThinkificEnrollment[]
  courses?: ThinkificCourse[]
  pagination?: {
    current_page: number
    total_pages: number
    total_items: number
  }
}

class ThinkificAPIService {
  private apiKey: string
  private subdomain: string
  private baseUrl: string

  constructor() {
    this.apiKey = Deno.env.get('THINKIFIC_API_KEY') || ''
    this.subdomain = Deno.env.get('THINKIFIC_SUBDOMAIN') || ''
    this.baseUrl = `https://${this.subdomain}.thinkific.com/api/public/v1`

    if (!this.apiKey || !this.subdomain) {
      throw new Error('Missing Thinkific credentials in environment variables')
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const fullUrl = `${this.baseUrl}${endpoint}`
    console.log(`🌐 Making Thinkific API request to: ${fullUrl}`)
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'X-Auth-API-Key': this.apiKey,
          'X-Auth-Subdomain': this.subdomain,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      console.log(`📡 Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Thinkific API error: ${response.status} - ${errorText}`)
        throw new Error(`Thinkific API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ Successfully parsed response data`)
      return data
    } catch (error) {
      console.error(`💥 Error in makeRequest to ${fullUrl}:`, error)
      throw error
    }
  }

  async getEnrollmentByUserEmail(email: string, courseId: string): Promise<ThinkificEnrollment | null> {
    try {
      // Get user by email first
      const usersResponse = await this.makeRequest(`/users?query[email]=${encodeURIComponent(email)}`)
      
      if (!usersResponse.items || usersResponse.items.length === 0) {
        return null
      }

      const userId = usersResponse.items[0].id

      // Get enrollments for the user
      const enrollmentsResponse = await this.makeRequest(`/enrollments?filter[user_id]=${userId}&filter[course_id]=${courseId}`)
      
      return enrollmentsResponse.items?.[0] || null
    } catch (error) {
      console.error('Error fetching enrollment:', error)
      throw error
    }
  }

  async getAssessments(courseId: string): Promise<ThinkificAssessment[]> {
    try {
      const response = await this.makeRequest(`/courses/${courseId}/assessments`)
      return response.items || []
    } catch (error) {
      // Handle 404 errors gracefully - some courses don't have assessments
      if (error.message.includes('404')) {
        console.log(`📝 No assessments found for course ${courseId} (this is normal for some courses)`)
        return []
      }
      console.error('Error fetching assessments:', error)
      throw error
    }
  }

  async getAssessmentResults(assessmentId: string, userId: number): Promise<ThinkificAssessmentResult[]> {
    try {
      const response = await this.makeRequest(`/assessments/${assessmentId}/results?filter[user_id]=${userId}`)
      return response.items || []
    } catch (error) {
      // Handle 404 errors gracefully - some students may not have assessment results
      if (error.message.includes('404')) {
        console.log(`📊 No assessment results found for assessment ${assessmentId} and user ${userId} (this is normal)`)
        return []
      }
      console.error('Error fetching assessment results:', error)
      throw error
    }
  }

  async getCourse(courseId: string): Promise<ThinkificCourse | null> {
    try {
      const response = await this.makeRequest(`/courses/${courseId}`)
      return response
    } catch (error) {
      console.error('Error fetching course:', error)
      throw error
    }
  }

  async getStudentCertificateData(email: string, courseId: string) {
    try {
      // Get enrollment
      const enrollment = await this.getEnrollmentByUserEmail(email, courseId)
      
      if (!enrollment) {
        return {
          enrollment: null,
          assessments: [],
          assessmentResults: [],
          course: null,
          overallScore: undefined
        }
      }

      // Get parallel data
      const [assessments, course] = await Promise.all([
        this.getAssessments(courseId),
        this.getCourse(courseId)
      ])

      // Get assessment results for all assessments
      const assessmentResults: ThinkificAssessmentResult[] = []
      for (const assessment of assessments) {
        const results = await this.getAssessmentResults(assessment.id.toString(), enrollment.user_id)
        assessmentResults.push(...results)
      }

      // Calculate overall score
      const overallScore = this.calculateOverallScore(assessments, assessmentResults)

      return {
        enrollment,
        assessments,
        assessmentResults,
        course,
        overallScore
      }
    } catch (error) {
      console.error('Error getting student certificate data:', error)
      throw error
    }
  }

  private calculateOverallScore(assessments: ThinkificAssessment[], results: ThinkificAssessmentResult[]) {
    if (results.length === 0) {
      return undefined
    }

    // Group assessments by type (practical vs written)
    const practicalResults = results.filter(result => {
      const assessment = assessments.find(a => a.id === result.assessment_id)
      return assessment?.assessment_type?.toLowerCase().includes('practical') || 
             assessment?.name?.toLowerCase().includes('practical')
    })

    const writtenResults = results.filter(result => {
      const assessment = assessments.find(a => a.id === result.assessment_id)
      return assessment?.assessment_type?.toLowerCase().includes('written') || 
             assessment?.assessment_type?.toLowerCase().includes('quiz') ||
             assessment?.name?.toLowerCase().includes('written') ||
             assessment?.name?.toLowerCase().includes('quiz')
    })

    // Calculate averages
    const practicalScore = practicalResults.length > 0 
      ? practicalResults.reduce((sum, r) => sum + r.score, 0) / practicalResults.length 
      : 0

    const writtenScore = writtenResults.length > 0 
      ? writtenResults.reduce((sum, r) => sum + r.score, 0) / writtenResults.length 
      : 0

    // Weighted total (60% practical, 40% written)
    const totalScore = (practicalScore * 0.6) + (writtenScore * 0.4)
    const passed = practicalScore >= 70 && writtenScore >= 70 && totalScore >= 70

    return {
      practical: Math.round(practicalScore * 100) / 100,
      written: Math.round(writtenScore * 100) / 100,
      total: Math.round(totalScore * 100) / 100,
      passed
    }
  }

  async getAllUsers(page: number = 1, perPage: number = 100): Promise<BulkDataResponse> {
    try {
      const response = await this.makeRequest(`/users?page=${page}&per_page=${perPage}`)
      
      return {
        users: response.items || [],
        pagination: {
          current_page: response.meta?.pagination?.current_page || page,
          total_pages: response.meta?.pagination?.total_pages || 1,
          total_items: response.meta?.pagination?.total_items || response.items?.length || 0
        }
      }
    } catch (error) {
      console.error('Error fetching all users:', error)
      throw error
    }
  }

  async getAllCourses(page: number = 1, perPage: number = 100): Promise<BulkDataResponse> {
    try {
      const response = await this.makeRequest(`/courses?page=${page}&per_page=${perPage}`)
      
      return {
        courses: response.items || [],
        pagination: {
          current_page: response.meta?.pagination?.current_page || page,
          total_pages: response.meta?.pagination?.total_pages || 1,
          total_items: response.meta?.pagination?.total_items || response.items?.length || 0
        }
      }
    } catch (error) {
      console.error('Error fetching all courses:', error)
      throw error
    }
  }

  async getAllEnrollments(page: number = 1, perPage: number = 100): Promise<BulkDataResponse> {
    try {
      const response = await this.makeRequest(`/enrollments?page=${page}&per_page=${perPage}`)
      
      return {
        enrollments: response.items || [],
        pagination: {
          current_page: response.meta?.pagination?.current_page || page,
          total_pages: response.meta?.pagination?.total_pages || 1,
          total_items: response.meta?.pagination?.total_items || response.items?.length || 0
        }
      }
    } catch (error) {
      console.error('Error fetching all enrollments:', error)
      throw error
    }
  }

  async getAllStudentsWithEnrollments(): Promise<{
    students: Array<ThinkificUser & {
      enrollments: Array<ThinkificEnrollment & { course_name?: string, assessments?: ThinkificAssessment[] }>
    }>
    totalStudents: number
    totalEnrollments: number
    totalCourses: number
    assessments: ThinkificAssessment[]
  }> {
    try {
      console.log('🔍 Fetching ALL students, enrollments, and courses from Thinkific with pagination...')
      
      // Fetch ALL users with pagination
      console.log('👤 Fetching ALL users with pagination (including those without enrollments)...')
      const allUsers: ThinkificUser[] = []
      let userPage = 1
      let hasMoreUsers = true
      
      while (hasMoreUsers) {
        try {
          const usersData = await this.getAllUsers(userPage, 100)
          const users = usersData.users || []
          allUsers.push(...users)
          
          console.log(`👥 Page ${userPage}: Fetched ${users.length} users (Total: ${allUsers.length})`)
          
          if (users.length < 100 || userPage >= (usersData.pagination?.total_pages || 1)) {
            hasMoreUsers = false
          } else {
            userPage++
          }
        } catch (userError) {
          console.error(`❌ Error fetching users page ${userPage}:`, userError)
          throw new Error(`Failed to fetch users page ${userPage}: ${userError.message}`)
        }
      }

      // Fetch ALL enrollments with pagination
      console.log('📚 Fetching ALL enrollments with pagination...')
      const allEnrollments: ThinkificEnrollment[] = []
      let enrollmentPage = 1
      let hasMoreEnrollments = true
      
      while (hasMoreEnrollments) {
        try {
          const enrollmentsData = await this.getAllEnrollments(enrollmentPage, 100)
          const enrollments = enrollmentsData.enrollments || []
          allEnrollments.push(...enrollments)
          
          console.log(`📖 Page ${enrollmentPage}: Fetched ${enrollments.length} enrollments (Total: ${allEnrollments.length})`)
          
          if (enrollments.length < 100 || enrollmentPage >= (enrollmentsData.pagination?.total_pages || 1)) {
            hasMoreEnrollments = false
          } else {
            enrollmentPage++
          }
        } catch (enrollmentError) {
          console.error(`❌ Error fetching enrollments page ${enrollmentPage}:`, enrollmentError)
          throw new Error(`Failed to fetch enrollments page ${enrollmentPage}: ${enrollmentError.message}`)
        }
      }

      // Fetch ALL courses with pagination for name mapping
      console.log('🎓 Fetching ALL courses with pagination for name mapping...')
      const allCourses: ThinkificCourse[] = []
      let coursePage = 1
      let hasMoreCourses = true
      
      while (hasMoreCourses) {
        try {
          const coursesData = await this.getAllCourses(coursePage, 100)
          const courses = coursesData.courses || []
          allCourses.push(...courses)
          
          console.log(`🏫 Page ${coursePage}: Fetched ${courses.length} courses (Total: ${allCourses.length})`)
          
          if (courses.length < 100 || coursePage >= (coursesData.pagination?.total_pages || 1)) {
            hasMoreCourses = false
          } else {
            coursePage++
          }
        } catch (courseError) {
          console.error(`❌ Error fetching courses page ${coursePage}:`, courseError)
          throw new Error(`Failed to fetch courses page ${coursePage}: ${courseError.message}`)
        }
      }

      console.log(`🔄 Processing ${allUsers.length} users, ${allEnrollments.length} enrollments, and ${allCourses.length} courses...`)

      // Fetch assessments for all courses
      console.log('🧪 Fetching assessments for all courses...')
      const allAssessments: ThinkificAssessment[] = []
      for (const course of allCourses) {
        try {
          const assessments = await this.getAssessments(course.id.toString())
          allAssessments.push(...assessments)
        } catch (error) {
          console.log(`⚠️ Skipping assessments for course ${course.id}: ${error.message}`)
        }
      }
      
      console.log(`📝 Found ${allAssessments.length} total assessments across all courses`)

      // Create course lookup map for name resolution
      const courseLookup = allCourses.reduce((acc, course) => {
        acc[course.id] = course.name
        return acc
      }, {} as Record<number, string>)

      // Create assessments lookup by course
      const assessmentsByCourse = allAssessments.reduce((acc, assessment) => {
        if (!acc[assessment.course_id]) {
          acc[assessment.course_id] = []
        }
        acc[assessment.course_id].push(assessment)
        return acc
      }, {} as Record<number, ThinkificAssessment[]>)

      // Group enrollments by user ID and enrich with course names and assessments
      const enrollmentsByUser = allEnrollments.reduce((acc, enrollment) => {
        if (!acc[enrollment.user_id]) {
          acc[enrollment.user_id] = []
        }
        
        // Enrich enrollment with course name and assessments
        const enrichedEnrollment = {
          ...enrollment,
          course_name: courseLookup[enrollment.course_id] || `Course ${enrollment.course_id}`,
          assessments: assessmentsByCourse[enrollment.course_id] || []
        }
        
        acc[enrollment.user_id].push(enrichedEnrollment)
        return acc
      }, {} as Record<number, Array<ThinkificEnrollment & { course_name?: string, assessments?: ThinkificAssessment[] }>>)

      // Combine users with their enriched enrollments
      const studentsWithEnrollments = allUsers.map(user => ({
        ...user,
        enrollments: enrollmentsByUser[user.id] || []
      })) // Include ALL students, even those without enrollments

      console.log(`✅ Successfully processed complete dataset:`)
      console.log(`   📊 ${studentsWithEnrollments.length} total students`)
      console.log(`   📚 ${allEnrollments.length} total enrollments`) 
      console.log(`   🎓 ${allCourses.length} total courses`)
      console.log(`   👥 ${studentsWithEnrollments.filter(s => s.enrollments.length > 0).length} students with enrollments`)
      console.log(`   👤 ${studentsWithEnrollments.filter(s => s.enrollments.length === 0).length} students without enrollments`)

      return {
        students: studentsWithEnrollments,
        totalStudents: studentsWithEnrollments.length,
        totalEnrollments: allEnrollments.length,
        totalCourses: allCourses.length,
        assessments: allAssessments
      }
    } catch (error) {
      console.error('💥 Error in getAllStudentsWithEnrollments:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      throw error
    }
  }

  async syncScores(userIds: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const userId of userIds) {
      try {
        // Implementation would sync scores to your database
        // This is a placeholder for the actual sync logic
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call
        success++
      } catch (error) {
        failed++
        errors.push(`Failed to sync user ${userId}: ${error.message}`)
      }
    }

    return { success, failed, errors }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, email, courseId, enrollmentId, assessmentId, userIds, page, per_page }: ThinkificRequest = await req.json()

    const thinkificService = new ThinkificAPIService()

    let result: any

    switch (action) {
      case 'getEnrollment':
        if (!email || !courseId) {
          throw new Error('Email and courseId are required for getEnrollment')
        }
        result = await thinkificService.getEnrollmentByUserEmail(email, courseId)
        break

      case 'getAssessments':
        if (!courseId) {
          throw new Error('CourseId is required for getAssessments')
        }
        result = await thinkificService.getAssessments(courseId)
        break

      case 'getAssessmentResults':
        if (!assessmentId || !enrollmentId) {
          throw new Error('AssessmentId and enrollmentId are required for getAssessmentResults')
        }
        result = await thinkificService.getAssessmentResults(assessmentId, parseInt(enrollmentId))
        break

      case 'getCourse':
        if (!courseId) {
          throw new Error('CourseId is required for getCourse')
        }
        result = await thinkificService.getCourse(courseId)
        break

      case 'getStudentData':
        if (!email || !courseId) {
          throw new Error('Email and courseId are required for getStudentData')
        }
        result = await thinkificService.getStudentCertificateData(email, courseId)
        break

      case 'syncScores':
        if (!userIds || !Array.isArray(userIds)) {
          throw new Error('UserIds array is required for syncScores')
        }
        result = await thinkificService.syncScores(userIds)
        break

      case 'getAllStudents':
        result = await thinkificService.getAllStudentsWithEnrollments()
        break

      case 'getAllCourses':
        const coursePage = page || 1
        const coursePerPage = per_page || 100
        result = await thinkificService.getAllCourses(coursePage, coursePerPage)
        break

      case 'getAllEnrollments':
        const enrollmentPage = page || 1
        const enrollmentPerPage = per_page || 100
        result = await thinkificService.getAllEnrollments(enrollmentPage, enrollmentPerPage)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Thinkific API Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})