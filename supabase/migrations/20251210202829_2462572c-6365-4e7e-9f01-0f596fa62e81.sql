-- Create FAQs table for admin management
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active FAQs
CREATE POLICY "Anyone can view active FAQs" 
ON public.faqs 
FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

-- Admins can manage FAQs
CREATE POLICY "Admins can manage FAQs" 
ON public.faqs 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQs
INSERT INTO public.faqs (question, answer, display_order) VALUES
('Why should I choose Car Street to buy used cars?', 'At Car Street, we pride ourselves on offering high-quality pre-owned vehicles that are fully inspected and competitively priced while delivering exceptional customer service. Our transparent buying process, flexible financing options, and quick approvals make purchasing your next car simple and stress-free.', 1),
('What types of vehicles do you sell?', 'From sedans and spacious family SUVs to powerful pickup trucks, We offer an extensive selection of quality pre-owned vehicles to suit every lifestyle. Our inventory features leading brands such as Toyota, Lexus, Honda, BMW, Ford, Jeep, Hyundai, Chevrolet, and Mercedes-Benz, among others.', 2),
('Are your vehicles inspected and certified?', 'Yes. Every vehicle at Car Street goes through a comprehensive inspection performed by certified technicians. This ensures that each vehicle meets our strict standards for safety and performance before reaching our lot.', 3),
('What is the down payment required?', 'The required down payment depends on the vehicle price, your credit profile, and financing terms. Our finance team works with multiple lenders to help you find the most affordable option possible. However, you can confirm the exact price for the specific model you choose during financing.', 4),
('How long does the approval process take?', 'Our financing approval process is designed to be quick and hassle-free. Most customers receive approval within minutes, and many are able to drive away the same day once documentation is complete.', 5),
('Can I purchase a vehicle online or remotely?', 'Yes. You can browse our entire inventory, get pre-qualified for financing, and start your purchase online. Our team can also assist you virtually throughout the buying process to make your experience smooth and convenient.', 6),
('Do you ship or deliver vehicles outside the local area?', 'Delivery within the local area may be available upon request. For customers located outside, please contact our sales team directly to discuss possible delivery arrangements.', 7),
('How do I book a test drive?', 'You can book a test drive by contacting our team through our website''s contact form or by calling our dealership directly. Simply share the vehicle you are interested in and your preferred time, and we will confirm your appointment promptly.', 8),
('Can I get a loan with bad credit?', 'Absolutely. We specialize in helping customers with all credit types, no matter their situation. Whether you have good credit or bad, we have access to multiple lenders. Our finance experts will work to secure the best possible rates and terms for your situation.', 9),
('Can I bring my own mechanic to inspect the car before purchase?', 'Customers are welcome to request an independent inspection prior to purchase. Please coordinate with our team in advance so we can schedule a convenient time for your mechanic to view the vehicle.', 10);