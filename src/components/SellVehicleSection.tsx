import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SellVehicleSection() {
  const benefits = [
    "Skip the stress of private sales and sell your car to us for cash.",
    "Get an instant online offer, valid for 7 days.",
    "No low ball offers, no time wasted, no dealing with strangers.",
  ];

  return (
    <section className="py-12 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Sell Your Car to <span className="text-primary">Car Street</span>
          </h2>
          
          <div className="space-y-3 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-center gap-3 text-secondary-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
          
          <Button size="lg" variant="default" asChild className="text-lg px-8">
            <Link to="/sell-my-car">Sell Your Car the Easy Way Today!</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
