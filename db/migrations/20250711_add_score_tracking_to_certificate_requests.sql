-- Add comprehensive score tracking fields to certificate_requests
-- This migration enhances the certificate review process with automatic pass/fail determination

-- Add score and completion tracking fields
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS practical_score DECIMAL(5,2) NULL;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS written_score DECIMAL(5,2) NULL;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS total_score DECIMAL(5,2) NULL;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP NULL;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS online_completion_date TIMESTAMP NULL;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS practical_completion_date TIMESTAMP NULL;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS pass_threshold DECIMAL(5,2) DEFAULT 80.00;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS calculated_status VARCHAR(20) NULL;

-- Score weighting and configuration
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS practical_weight DECIMAL(3,2) DEFAULT 0.50;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS written_weight DECIMAL(3,2) DEFAULT 0.50;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS requires_both_scores BOOLEAN DEFAULT true;

-- Add constraints for score validation
ALTER TABLE public.certificate_requests ADD CONSTRAINT check_practical_score_range 
  CHECK (practical_score IS NULL OR (practical_score >= 0 AND practical_score <= 100));
ALTER TABLE public.certificate_requests ADD CONSTRAINT check_written_score_range 
  CHECK (written_score IS NULL OR (written_score >= 0 AND written_score <= 100));
ALTER TABLE public.certificate_requests ADD CONSTRAINT check_total_score_range 
  CHECK (total_score IS NULL OR (total_score >= 0 AND total_score <= 100));
ALTER TABLE public.certificate_requests ADD CONSTRAINT check_pass_threshold_range 
  CHECK (pass_threshold >= 0 AND pass_threshold <= 100);
ALTER TABLE public.certificate_requests ADD CONSTRAINT check_weight_range 
  CHECK (practical_weight >= 0 AND practical_weight <= 1 AND written_weight >= 0 AND written_weight <= 1);

-- Add calculated status constraint
ALTER TABLE public.certificate_requests ADD CONSTRAINT check_calculated_status 
  CHECK (calculated_status IS NULL OR calculated_status IN ('AUTO_PASS', 'AUTO_FAIL', 'MANUAL_REVIEW', 'PENDING_SCORES'));

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_certificate_requests_calculated_status ON certificate_requests(calculated_status);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_total_score ON certificate_requests(total_score);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_completion_date ON certificate_requests(completion_date);

-- Create function to calculate total score and status
CREATE OR REPLACE FUNCTION calculate_certificate_status(
  p_practical_score DECIMAL(5,2),
  p_written_score DECIMAL(5,2),
  p_practical_weight DECIMAL(3,2),
  p_written_weight DECIMAL(3,2),
  p_pass_threshold DECIMAL(5,2),
  p_requires_both_scores BOOLEAN
) RETURNS TABLE(
  total_score DECIMAL(5,2),
  calculated_status VARCHAR(20)
) AS $$
DECLARE
  v_total_score DECIMAL(5,2);
  v_status VARCHAR(20);
BEGIN
  -- Calculate weighted total score if both scores are available
  IF p_practical_score IS NOT NULL AND p_written_score IS NOT NULL THEN
    v_total_score := (p_practical_score * p_practical_weight) + (p_written_score * p_written_weight);
    
    -- Determine status based on total score and individual requirements
    IF v_total_score >= p_pass_threshold THEN
      -- Check if both individual scores meet threshold when required
      IF p_requires_both_scores THEN
        IF p_practical_score >= p_pass_threshold AND p_written_score >= p_pass_threshold THEN
          v_status := 'AUTO_PASS';
        ELSE
          v_status := 'MANUAL_REVIEW';
        END IF;
      ELSE
        v_status := 'AUTO_PASS';
      END IF;
    ELSE
      v_status := 'AUTO_FAIL';
    END IF;
  ELSE
    -- Partial scores available
    v_total_score := NULL;
    v_status := 'PENDING_SCORES';
  END IF;
  
  RETURN QUERY SELECT v_total_score, v_status;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update calculated fields
CREATE OR REPLACE FUNCTION update_certificate_calculations() RETURNS TRIGGER AS $$
DECLARE
  calc_result RECORD;
BEGIN
  -- Calculate total score and status when scores change
  IF NEW.practical_score IS DISTINCT FROM OLD.practical_score OR 
     NEW.written_score IS DISTINCT FROM OLD.written_score OR
     NEW.practical_weight IS DISTINCT FROM OLD.practical_weight OR
     NEW.written_weight IS DISTINCT FROM OLD.written_weight OR
     NEW.pass_threshold IS DISTINCT FROM OLD.pass_threshold OR
     NEW.requires_both_scores IS DISTINCT FROM OLD.requires_both_scores THEN
    
    SELECT * INTO calc_result FROM calculate_certificate_status(
      NEW.practical_score,
      NEW.written_score,
      COALESCE(NEW.practical_weight, 0.50),
      COALESCE(NEW.written_weight, 0.50),
      COALESCE(NEW.pass_threshold, 80.00),
      COALESCE(NEW.requires_both_scores, true)
    );
    
    NEW.total_score := calc_result.total_score;
    NEW.calculated_status := calc_result.calculated_status;
  END IF;
  
  -- Update completion_date when both online and practical are complete
  IF NEW.online_completion_date IS NOT NULL AND 
     NEW.practical_completion_date IS NOT NULL AND 
     NEW.completion_date IS NULL THEN
    NEW.completion_date := GREATEST(NEW.online_completion_date, NEW.practical_completion_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certificate_calculations ON certificate_requests;
CREATE TRIGGER trigger_update_certificate_calculations
  BEFORE UPDATE ON certificate_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_calculations();

-- Add comments for documentation
COMMENT ON COLUMN certificate_requests.practical_score IS 'Hands-on practical assessment score (0-100)';
COMMENT ON COLUMN certificate_requests.written_score IS 'Online written test score (0-100)';
COMMENT ON COLUMN certificate_requests.total_score IS 'Calculated weighted total score (0-100)';
COMMENT ON COLUMN certificate_requests.completion_date IS 'Overall completion date (latest of online/practical)';
COMMENT ON COLUMN certificate_requests.online_completion_date IS 'Date when online portion was completed';
COMMENT ON COLUMN certificate_requests.practical_completion_date IS 'Date when practical assessment was completed';
COMMENT ON COLUMN certificate_requests.pass_threshold IS 'Minimum score required to pass (configurable per request)';
COMMENT ON COLUMN certificate_requests.calculated_status IS 'Auto-calculated pass/fail status based on scores and thresholds';

-- Migration completion notification
DO $$
BEGIN
  RAISE NOTICE 'Certificate Requests Score Tracking Enhancement Complete:';
  RAISE NOTICE '✅ Added comprehensive score tracking fields (practical, written, total)';
  RAISE NOTICE '✅ Added completion date tracking (online, practical, overall)';
  RAISE NOTICE '✅ Added configurable pass/fail thresholds and score weighting';
  RAISE NOTICE '✅ Added automatic score calculation and status determination';
  RAISE NOTICE '✅ Added performance indexes for score-based queries';
  RAISE NOTICE '✅ Added data validation constraints for score ranges';
  RAISE NOTICE '✅ Added trigger for automatic calculation updates';
  RAISE NOTICE '⚡ Ready for enhanced review component implementation';
END;
$$;