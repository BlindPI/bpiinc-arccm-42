import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface ThinkificRequest {
  action: 'getEnrollment' | 'getAssessments' | 'getAssessmentResults' | 'getCourse' | 'getStudentData' | 'syncScores'
  email?: string
  courseId?: string
  enrollmentId?: string
  assessmentId?: string
  userIds?: string[]
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
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-Auth-API-Key': this.apiKey,
        'X-Auth-Subdomain': this.subdomain,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Thinkific API error (${response.status}): ${errorText}`)
    }

    return response.json()
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
      console.error('Error fetching assessments:', error)
      throw error
    }
  }

  async getAssessmentResults(assessmentId: string, userId: number): Promise<ThinkificAssessmentResult[]> {
    try {
      const response = await this.makeRequest(`/assessments/${assessmentId}/results?filter[user_id]=${userId}`)
      return response.items || []
    } catch (error) {
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
    const { action, email, courseId, enrollmentId, assessmentId, userIds }: ThinkificRequest = await req.json()

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