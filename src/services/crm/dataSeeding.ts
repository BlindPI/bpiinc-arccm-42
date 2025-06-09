
import { supabase } from '@/integrations/supabase/client';

export class CRMDataSeeding {
  // Production Lead Scoring Rules
  static async seedLeadScoringRules() {
    const scoringRules = [
      {
        rule_name: 'High-Value Source',
        field_name: 'lead_source',
        operator: 'equals',
        field_value: 'referral',
        score_points: 40,
        priority: 1,
        is_active: true
      },
      {
        rule_name: 'Website Lead',
        field_name: 'lead_source', 
        operator: 'equals',
        field_value: 'website',
        score_points: 30,
        priority: 2,
        is_active: true
      },
      {
        rule_name: 'Immediate Training Need',
        field_name: 'training_urgency',
        operator: 'equals', 
        field_value: 'immediate',
        score_points: 25,
        priority: 3,
        is_active: true
      },
      {
        rule_name: 'Large Group Training',
        field_name: 'estimated_participant_count',
        operator: 'greater_than',
        field_value: '50',
        score_points: 20,
        priority: 4,
        is_active: true
      },
      {
        rule_name: 'Contact Completeness',
        field_name: 'email',
        operator: 'contains',
        field_value: '@',
        score_points: 15,
        priority: 5,
        is_active: true
      }
    ];

    for (const rule of scoringRules) {
      const { error } = await supabase
        .from('crm_lead_scoring_rules')
        .upsert(rule, { 
          onConflict: 'rule_name',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error seeding scoring rule:', rule.rule_name, error);
      }
    }
  }

  // Production Email Templates
  static async seedEmailTemplates() {
    const templates = [
      {
        template_name: 'Welcome & Course Information',
        template_type: 'welcome',
        subject_line: 'Welcome to {company_name} - Your Training Journey Begins',
        email_content: `
          <h2>Welcome {first_name}!</h2>
          <p>Thank you for your interest in our professional training programs.</p>
          <p>Based on your inquiry about {course_type} training for {estimated_participant_count} participants, 
          we have prepared a customized training proposal.</p>
          <p>Our certified instructors will provide comprehensive training that meets all regulatory requirements.</p>
          <p>Next steps:</p>
          <ul>
            <li>Review the attached training proposal</li>
            <li>Schedule a consultation call</li>
            <li>Discuss scheduling and logistics</li>
          </ul>
          <p>Best regards,<br>{instructor_name}<br>Certified Training Professional</p>
        `,
        personalization_fields: {
          first_name: 'Lead First Name',
          company_name: 'Company Name', 
          course_type: 'Requested Course Type',
          estimated_participant_count: 'Number of Participants',
          instructor_name: 'Assigned Instructor'
        },
        is_active: true
      },
      {
        template_name: 'Follow-up & Scheduling',
        template_type: 'follow_up',
        subject_line: 'Following up on your {course_type} training inquiry',
        email_content: `
          <h2>Hi {first_name},</h2>
          <p>I wanted to follow up on your recent inquiry about {course_type} training.</p>
          <p>We understand that training {estimated_participant_count} participants requires careful planning 
          and coordination.</p>
          <p>I have some available dates for the next few weeks:</p>
          <ul>
            <li>Option 1: {proposed_date_1}</li>
            <li>Option 2: {proposed_date_2}</li>
            <li>Option 3: {proposed_date_3}</li>
          </ul>
          <p>Would any of these work for your team? I'm also happy to discuss alternative dates.</p>
          <p>Best regards,<br>{instructor_name}</p>
        `,
        personalization_fields: {
          first_name: 'Lead First Name',
          course_type: 'Requested Course Type',
          estimated_participant_count: 'Number of Participants',
          proposed_date_1: 'First Proposed Date',
          proposed_date_2: 'Second Proposed Date', 
          proposed_date_3: 'Third Proposed Date',
          instructor_name: 'Assigned Instructor'
        },
        is_active: true
      },
      {
        template_name: 'Quote & Proposal',
        template_type: 'proposal',
        subject_line: 'Training Proposal for {company_name}',
        email_content: `
          <h2>Training Proposal for {company_name}</h2>
          <p>Dear {first_name},</p>
          <p>Thank you for considering our training services. Based on your requirements, 
          I have prepared a comprehensive proposal for {course_type} training.</p>
          
          <h3>Training Details:</h3>
          <ul>
            <li>Course: {course_type}</li>
            <li>Participants: {estimated_participant_count}</li>
            <li>Duration: {course_duration} hours</li>
            <li>Location: {training_location}</li>
            <li>Investment: {total_cost}</li>
          </ul>
          
          <h3>What's Included:</h3>
          <ul>
            <li>Certified professional instruction</li>
            <li>All training materials and resources</li>
            <li>Individual certificates upon completion</li>
            <li>24-month certificate validity</li>
          </ul>
          
          <p>This proposal is valid for 30 days. Please let me know if you have any questions 
          or if you'd like to proceed with booking.</p>
          
          <p>Best regards,<br>{instructor_name}<br>Certified Training Professional</p>
        `,
        personalization_fields: {
          company_name: 'Company Name',
          first_name: 'Lead First Name',
          course_type: 'Requested Course Type',
          estimated_participant_count: 'Number of Participants',
          course_duration: 'Course Duration',
          training_location: 'Proposed Training Location',
          total_cost: 'Total Training Cost',
          instructor_name: 'Assigned Instructor'
        },
        is_active: true
      }
    ];

    for (const template of templates) {
      const { error } = await supabase
        .from('crm_email_templates')
        .upsert(template, { 
          onConflict: 'template_name',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error seeding email template:', template.template_name, error);
      }
    }
  }

  // Production Assignment Rules
  static async seedAssignmentRules() {
    const assignmentRules = [
      {
        rule_name: 'Round Robin - General Inquiries',
        rule_description: 'Distribute general training inquiries evenly among available instructors',
        assignment_type: 'round_robin',
        criteria: {
          lead_source: ['website', 'social_media', 'email'],
          training_urgency: ['planning', 'within_quarter']
        },
        priority: 1,
        is_active: true,
        automation_enabled: true,
        working_hours: {
          start_time: '08:00',
          end_time: '17:00',
          timezone: 'America/Toronto',
          business_days: [1, 2, 3, 4, 5]
        },
        escalation_rules: {
          escalate_after_hours: 2,
          escalate_to_supervisor: true
        }
      },
      {
        rule_name: 'Load Balanced - High Priority',
        rule_description: 'Assign urgent leads based on current workload',
        assignment_type: 'load_balanced',
        criteria: {
          training_urgency: ['immediate', 'within_month'],
          estimated_participant_count: ['20+']
        },
        priority: 2,
        is_active: true,
        automation_enabled: true,
        working_hours: {
          start_time: '07:00',
          end_time: '19:00', 
          timezone: 'America/Toronto',
          business_days: [1, 2, 3, 4, 5]
        },
        escalation_rules: {
          escalate_after_hours: 1,
          escalate_to_supervisor: true,
          notify_manager: true
        }
      },
      {
        rule_name: 'Skill Based - Specialized Training',
        rule_description: 'Assign specialized training requests to qualified instructors',
        assignment_type: 'skill_based',
        criteria: {
          course_type: ['advanced_first_aid', 'cpr_instructor', 'wilderness_first_aid'],
          instructor_level: ['IT', 'IN']
        },
        priority: 3,
        is_active: true,
        automation_enabled: true,
        working_hours: {
          start_time: '08:00',
          end_time: '17:00',
          timezone: 'America/Toronto', 
          business_days: [1, 2, 3, 4, 5, 6]
        },
        escalation_rules: {
          escalate_after_hours: 4,
          escalate_to_supervisor: false
        }
      }
    ];

    for (const rule of assignmentRules) {
      const { error } = await supabase
        .from('crm_assignment_rules')
        .upsert(rule, { 
          onConflict: 'rule_name',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error seeding assignment rule:', rule.rule_name, error);
      }
    }
  }

  // Performance Baselines
  static async seedPerformanceBaselines() {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .in('role', ['SA', 'AD', 'IT', 'IN']);

    if (error || !users) {
      console.error('Error fetching users for performance baselines:', error);
      return;
    }

    for (const user of users) {
      const baseline = {
        user_id: user.id,
        assignment_date: new Date().toISOString().split('T')[0],
        leads_assigned: 0,
        leads_contacted: 0,
        leads_qualified: 0,
        leads_converted: 0,
        avg_response_time: '2 hours',
        quality_score: 85,
        current_load: 0,
        max_capacity: user.role === 'SA' ? 100 : user.role === 'AD' ? 75 : 50,
        availability_status: 'available'
      };

      const { error: insertError } = await supabase
        .from('crm_assignment_performance')
        .upsert(baseline, { 
          onConflict: 'user_id,assignment_date',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error('Error seeding performance baseline for:', user.display_name, insertError);
      }
    }
  }

  // Lead Workflows
  static async seedLeadWorkflows() {
    const workflows = [
      {
        workflow_name: 'New Lead Processing',
        workflow_description: 'Automated workflow for processing new incoming leads',
        trigger_conditions: {
          lead_status: 'new',
          created_within_minutes: 5
        },
        workflow_steps: [
          {
            step_number: 1,
            step_name: 'Calculate Lead Score',
            action_type: 'scoring',
            action_config: {
              use_scoring_rules: true,
              min_score_threshold: 30
            }
          },
          {
            step_number: 2,
            step_name: 'Intelligent Assignment',
            action_type: 'assignment',
            action_config: {
              assignment_method: 'load_balanced',
              consider_working_hours: true
            }
          },
          {
            step_number: 3,
            step_name: 'Send Welcome Email',
            action_type: 'email',
            action_config: {
              template_name: 'Welcome & Course Information',
              delay_minutes: 10
            }
          }
        ],
        success_metrics: {
          min_score_improvement: 10,
          max_assignment_time_minutes: 15,
          email_delivery_rate: 95
        },
        failure_handling: {
          retry_attempts: 3,
          escalate_on_failure: true,
          notification_recipients: ['supervisors']
        },
        execution_priority: 1,
        is_active: true
      },
      {
        workflow_name: 'High-Priority Lead Escalation', 
        workflow_description: 'Fast-track processing for urgent training requests',
        trigger_conditions: {
          training_urgency: 'immediate',
          estimated_participant_count: 20
        },
        workflow_steps: [
          {
            step_number: 1,
            step_name: 'Priority Scoring',
            action_type: 'scoring',
            action_config: {
              bonus_points: 25,
              override_normal_scoring: true
            }
          },
          {
            step_number: 2,
            step_name: 'Senior Instructor Assignment',
            action_type: 'assignment',
            action_config: {
              assignment_method: 'skill_based',
              required_roles: ['IT', 'IN'],
              bypass_capacity_limits: true
            }
          },
          {
            step_number: 3,
            step_name: 'Immediate Notification',
            action_type: 'notification',
            action_config: {
              notify_assigned_user: true,
              notify_supervisors: true,
              urgency_level: 'high'
            }
          }
        ],
        success_metrics: {
          assignment_time_minutes: 5,
          response_time_hours: 1
        },
        failure_handling: {
          immediate_escalation: true,
          notification_recipients: ['managers', 'supervisors']
        },
        execution_priority: 10,
        is_active: true
      }
    ];

    for (const workflow of workflows) {
      const { error } = await supabase
        .from('crm_lead_workflows')
        .upsert(workflow, { 
          onConflict: 'workflow_name',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error seeding workflow:', workflow.workflow_name, error);
      }
    }
  }

  // Execute all seeding operations
  static async seedAllProductionData() {
    console.log('Starting CRM production data seeding...');
    
    try {
      await this.seedLeadScoringRules();
      console.log('✓ Lead scoring rules seeded');
      
      await this.seedEmailTemplates();
      console.log('✓ Email templates seeded');
      
      await this.seedAssignmentRules();
      console.log('✓ Assignment rules seeded');
      
      await this.seedPerformanceBaselines();
      console.log('✓ Performance baselines seeded');
      
      await this.seedLeadWorkflows();
      console.log('✓ Lead workflows seeded');
      
      console.log('🎉 All CRM production data seeded successfully!');
      
      return { success: true, message: 'All production data seeded successfully' };
    } catch (error) {
      console.error('Error during data seeding:', error);
      return { success: false, error: error.message };
    }
  }
}
