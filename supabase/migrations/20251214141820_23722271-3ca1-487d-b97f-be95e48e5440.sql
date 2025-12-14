-- Add carfax_url to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS carfax_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.vehicles.carfax_url IS 'URL to the Carfax report for this vehicle';