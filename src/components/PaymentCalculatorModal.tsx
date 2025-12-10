import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface PaymentCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiclePrice: number;
}

export default function PaymentCalculatorModal({
  isOpen,
  onClose,
  vehiclePrice,
}: PaymentCalculatorModalProps) {
  const [interestRate, setInterestRate] = useState(6.49);
  const [loanTerm, setLoanTerm] = useState(60); // months
  const [tradeInValue, setTradeInValue] = useState(0);
  const [includeHST, setIncludeHST] = useState(true);

  const HST_RATE = 0.13;

  // Calculate total amount to be financed
  const priceWithTax = includeHST ? vehiclePrice * (1 + HST_RATE) : vehiclePrice;
  const totalToFinance = Math.max(0, priceWithTax - tradeInValue);

  // Calculate payments
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment =
    monthlyRate > 0
      ? (totalToFinance * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
        (Math.pow(1 + monthlyRate, loanTerm) - 1)
      : totalToFinance / loanTerm;

  const biWeeklyPayment = monthlyPayment / 2;
  const weeklyPayment = (monthlyPayment * 12) / 52;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPayment = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">
            Estimate Your Payments
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vehicle Price Display */}
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Vehicle Price</p>
            <p className="text-3xl font-bold text-price">
              {formatCurrency(vehiclePrice)}
            </p>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Interest Rate</Label>
              <span className="text-sm font-medium">{interestRate.toFixed(2)}%</span>
            </div>
            <div className="flex gap-2 items-center">
              <Slider
                value={[interestRate]}
                onValueChange={(value) => setInterestRate(value[0])}
                min={0}
                max={20}
                step={0.01}
                className="flex-1"
              />
              <Input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                className="w-20"
                step="0.01"
              />
            </div>
          </div>

          {/* Loan Term */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Loan Term</Label>
              <span className="text-sm font-medium">{loanTerm} months</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[36, 48, 60, 72, 84].map((term) => (
                <button
                  key={term}
                  onClick={() => setLoanTerm(term)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    loanTerm === term
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Trade-in Value */}
          <div className="space-y-2">
            <Label htmlFor="tradeIn">Trade-in Value</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="tradeIn"
                type="number"
                value={tradeInValue || ""}
                onChange={(e) => setTradeInValue(parseFloat(e.target.value) || 0)}
                className="pl-7"
                placeholder="0"
              />
            </div>
          </div>

          {/* Include HST Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="hst">Include HST (13%)</Label>
            <Switch
              id="hst"
              checked={includeHST}
              onCheckedChange={setIncludeHST}
            />
          </div>

          {/* Total to Finance */}
          <div className="p-4 bg-secondary text-secondary-foreground rounded-lg">
            <p className="text-sm opacity-80 mb-1">
              Your total amount to be financed will be
            </p>
            <p className="text-2xl font-bold">{formatCurrency(totalToFinance)}</p>
          </div>

          {/* Payment Results */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Weekly</p>
              <p className="text-lg font-bold text-price">
                {formatPayment(weeklyPayment)}
              </p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Bi-Weekly</p>
              <p className="text-lg font-bold text-price">
                {formatPayment(biWeeklyPayment)}
              </p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Monthly</p>
              <p className="text-lg font-bold text-price">
                {formatPayment(monthlyPayment)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}