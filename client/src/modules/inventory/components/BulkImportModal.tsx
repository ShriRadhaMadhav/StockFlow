import { Modal } from '../../../components/ui/modal/Modal';
import { Button } from '../../../components/ui/button/Button';
import { UploadCloud } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Inventory"
      description="Upload a CSV file to update or add multiple inventory items at once."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled>Upload File</Button>
        </>
      }
    >
      <div className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center bg-background-secondary/50 hover:bg-background-secondary transition-colors cursor-pointer group">
        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm border border-border group-hover:border-accent/50 transition-colors">
          <UploadCloud className="h-6 w-6 text-foreground-secondary group-hover:text-accent transition-colors" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">Click or drag file to this area to upload</h3>
        <p className="text-xs text-foreground-secondary">
          Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.
        </p>
        <p className="text-xs text-foreground-secondary mt-4 font-medium">
          Accepted formats: .csv, .xlsx
        </p>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-foreground-secondary">Need a template?</span>
        <button className="text-accent hover:text-accent-hover font-medium">Download CSV Template</button>
      </div>
    </Modal>
  );
}
