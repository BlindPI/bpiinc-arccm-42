
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
