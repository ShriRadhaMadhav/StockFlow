import { Button } from '../../../components/ui/button/Button';
import { Select } from '../../../components/ui/input/Select';

interface InvoiceSummaryProps {
  subtotal: number;
  taxPercentage: number;
  onUpdateTax: (tax: number) => void;
  onFinalize: () => void;
  onSaveDraft: () => void;
}

export function InvoiceSummary({ subtotal, taxPercentage, onUpdateTax, onFinalize, onSaveDraft }: InvoiceSummaryProps) {
  const taxAmount = subtotal * (taxPercentage / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="bg-surface border border-border rounded-lg p-5 sticky top-20 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4">Invoice Summary</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-foreground-secondary">
          <span>Subtotal</span>
          <span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center text-foreground-secondary">
          <span>Tax</span>
          <div className="flex items-center gap-2">
            <div className="w-24">
              <Select 
                value={taxPercentage.toString()} 
                onChange={(e) => onUpdateTax(Number(e.target.value))}
                className="text-xs h-7 py-0"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="10">10%</option>
                <option value="18">18% GST</option>
                <option value="20">20%</option>
              </Select>
            </div>
            <span className="tabular-nums w-16 text-right">₹{taxAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border mt-3 flex justify-between items-center">
          <span className="font-semibold text-foreground">Total Amount</span>
          <span className="text-lg font-semibold tabular-nums text-foreground">₹{total.toFixed(2)}</span>
        </div>

        <div className="pt-4 space-y-4">
          <div>
            <label className="text-xs text-foreground-secondary block mb-1.5">Payment Terms</label>
            <Select defaultValue="net30" className="text-sm h-9">
              <option value="due_receipt">Due on Receipt</option>
              <option value="net15">Net 15</option>
              <option value="net30">Net 30</option>
              <option value="net60">Net 60</option>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-foreground-secondary block mb-1.5">Internal Notes</label>
            <textarea 
              className="w-full h-20 text-sm border border-border rounded-md bg-surface p-2 focus:outline-none focus:ring-2 focus:ring-accent resize-none custom-scrollbar"
              placeholder="Add payment instructions or notes..."
            />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button className="w-full" onClick={onFinalize} disabled={total === 0}>
          Finalize & Generate
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onSaveDraft}>
            Save Draft
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onFinalize}>
            Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
