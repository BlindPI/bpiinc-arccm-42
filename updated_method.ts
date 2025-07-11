  async getAllStudentsWithEnrollments(): Promise<{
    students: Array<ThinkificUser & { 
      enrollments: Array<ThinkificEnrollment & { course_name?: string }> 
    }>
    totalStudents: number
    totalEnrollments: number
    totalCourses: number
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

      // Create course lookup map for name resolution
      const courseLookup = allCourses.reduce((acc, course) => {
        acc[course.id] = course.name
        return acc
      }, {} as Record<number, string>)

      // Group enrollments by user ID and enrich with course names
      const enrollmentsByUser = allEnrollments.reduce((acc, enrollment) => {
        if (!acc[enrollment.user_id]) {
          acc[enrollment.user_id] = []
        }
        
        // Enrich enrollment with course name
        const enrichedEnrollment = {
          ...enrollment,
          course_name: courseLookup[enrollment.course_id] || `Course ${enrollment.course_id}`
        }
        
        acc[enrollment.user_id].push(enrichedEnrollment)
        return acc
      }, {} as Record<number, Array<ThinkificEnrollment & { course_name?: string }>>)

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
        totalCourses: allCourses.length
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