-- migration 0007_add_subscriptions.sql
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS mp_subscription_id text;

-- Update existing businesses to have a trial ending 15 days from their creation date
UPDATE public.businesses
SET trial_ends_at = created_at + interval '15 days'
WHERE trial_ends_at IS NULL;

-- Function and Trigger to automatically set trial_ends_at for new businesses
CREATE OR REPLACE FUNCTION public.set_business_trial()
RETURNS trigger AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := NOW() + interval '15 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_business_trial ON public.businesses;

CREATE TRIGGER trg_set_business_trial
BEFORE INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.set_business_trial();
