
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Builder class to construct complex certificate queries
 */
export class CertificateQueryBuilder {
  private query: PostgrestFilterBuilder<any, any, any>;
  
  constructor(baseQuery: PostgrestFilterBuilder<any, any, any>) {
    this.query = baseQuery;
  }
  
  /**
   * Filter certificates by active status
   */
  public whereActive(): CertificateQueryBuilder {
    this.query = this.query.eq('status', 'ACTIVE');
    return this;
  }
  
  /**
   * Filter certificates by expired status
   */
  public whereExpired(): CertificateQueryBuilder {
    this.query = this.query.eq('status', 'EXPIRED');
    return this;
  }
  
  /**
   * Filter certificates by revoked status
   */
  public whereRevoked(): CertificateQueryBuilder {
    this.query = this.query.eq('status', 'REVOKED');
    return this;
  }
  
  /**
   * Filter certificates by recipient (user)
   */
  public forUser(userId: string): CertificateQueryBuilder {
    this.query = this.query.eq('user_id', userId);
    return this;
  }
  
  /**
   * Filter certificates by course name
   */
  public forCourse(courseName: string): CertificateQueryBuilder {
    this.query = this.query.eq('course_name', courseName);
    return this;
  }
  
  /**
   * Filter certificates by issuing administrator
   */
  public issuedBy(adminId: string): CertificateQueryBuilder {
    this.query = this.query.eq('issued_by', adminId);
    return this;
  }
  
  /**
   * Filter certificates by batch ID
   */
  public inBatch(batchId: string): CertificateQueryBuilder {
    this.query = this.query.eq('batch_id', batchId);
    return this;
  }
  
  /**
   * Filter certificates by email status
   */
  public withEmailStatus(status: string | null): CertificateQueryBuilder {
    if (status === null) {
      this.query = this.query.is('email_status', null);
    } else {
      this.query = this.query.eq('email_status', status);
    }
    return this;
  }
  
  /**
   * Filter certificates that have not been emailed
   */
  public notEmailed(): CertificateQueryBuilder {
    this.query = this.query.is('last_emailed_at', null);
    return this;
  }
  
  /**
   * Limit results
   */
  public limit(count: number): CertificateQueryBuilder {
    this.query = this.query.limit(count);
    return this;
  }
  
  /**
   * Set result order
   */
  public orderBy(column: string, ascending: boolean = true): CertificateQueryBuilder {
    this.query = this.query.order(column, { ascending });
    return this;
  }
  
  /**
   * Get the constructed query
   */
  public getQuery(): PostgrestFilterBuilder<any, any, any> {
    return this.query;
  }
}

// Helper function to build certificate queries
export const buildCertificateQuery = (baseQuery: PostgrestFilterBuilder<any, any, any>): CertificateQueryBuilder => {
  return new CertificateQueryBuilder(baseQuery);
};
