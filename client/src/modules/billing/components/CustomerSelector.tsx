import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Loader2, Mail, Phone, MapPin, Hash } from 'lucide-react';
import { Input } from '../../../components/ui/input/Input';
import { Button } from '../../../components/ui/button/Button';
import { Modal } from '../../../components/ui/modal/Modal';
import { customerApi } from '../../../services/api/customer.api';
import { useDebounce } from '../../../hooks/useDebounce';

interface CustomerSelectorProps {
  selectedCustomer: any | null;
  onSelect: (customer: any) => void;
}

export function CustomerSelector({ selectedCustomer, onSelect }: CustomerSelectorProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerGst, setNewCustomerGst] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', 'search', debouncedSearch],
    queryFn: () => customerApi.getCustomers({ search: debouncedSearch, limit: 5 }),
    enabled: isDropdownOpen, // Only fetch when dropdown is open
  });

  // Mutation for creating customer inline
  const createCustomerMutation = useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string; address?: string; gstNumber?: string }) => {
      return customerApi.createCustomer(data);
    },
    onSuccess: (response) => {
      const created = response.data;
      // Auto-select the newly created customer for the invoice
      onSelect({ id: created._id, ...created });
      
      // Clear form and close modal
      resetForm();
      setIsModalOpen(false);
      
      // Invalidate queries to update customer cache
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create customer');
    }
  });

  const resetForm = () => {
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    setNewCustomerGst('');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      setFormError('Customer name is required');
      return;
    }
    
    createCustomerMutation.mutate({
      name: newCustomerName.trim(),
      email: newCustomerEmail.trim() || undefined,
      phone: newCustomerPhone.trim() || undefined,
      address: newCustomerAddress.trim() || undefined,
      gstNumber: newCustomerGst.trim() || undefined,
    });
  };

  const filteredCustomers = data?.data?.customers || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Customer Details</h3>
        <Button 
          variant="secondary" 
          size="sm" 
          type="button"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="text-xs h-8 px-3 font-semibold text-accent border border-accent/20 bg-accent/5 hover:bg-accent hover:text-white transition-all shadow-sm flex items-center gap-1.5 rounded-lg"
        >
          <UserPlus className="h-3.5 w-3.5" />
          New Customer
        </Button>
      </div>

      {!selectedCustomer ? (
        <div className="relative">
          <Input
            placeholder="Search customers by name or email..."
            leftIcon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
          />
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-md z-10 max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 flex justify-center text-foreground-secondary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <div 
                    key={customer._id}
                    className="px-3 py-2 hover:bg-background-secondary cursor-pointer text-sm"
                    onClick={() => {
                      onSelect({ id: customer._id, ...customer }); // map id
                      setSearchTerm('');
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="font-medium text-foreground">{customer.name}</div>
                    <div className="text-xs text-foreground-secondary">{customer.email}</div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-sm text-foreground-secondary">
                  No customers found. Click "New Customer" to create one.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 border border-border rounded-md bg-background-secondary/30 relative group">
          <div className="font-medium text-foreground">{selectedCustomer.name}</div>
          <div className="text-xs text-foreground-secondary mt-1">{selectedCustomer.email}</div>
          {selectedCustomer.phone && <div className="text-xs text-foreground-secondary">{selectedCustomer.phone}</div>}
          <div className="text-xs text-foreground-secondary">{selectedCustomer.address}</div>
          <button 
            type="button"
            className="absolute top-3 right-3 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onSelect(null as any)}
          >
            Change
          </button>
        </div>
      )}

      {/* Modern, Premium Customer Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Customer"
        description="Register a new customer to generate invoices and track transactions."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm font-medium animate-pulse">
              {formError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Customer Name *
              </label>
              <Input
                required
                placeholder="Enter company or individual name"
                leftIcon={<UserPlus className="h-4 w-4" />}
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Phone Number
                </label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  leftIcon={<Phone className="h-4 w-4" />}
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                GST / Tax Identification Number
              </label>
              <Input
                placeholder="e.g. 27AAAAA1111A1Z1"
                leftIcon={<Hash className="h-4 w-4" />}
                value={newCustomerGst}
                onChange={(e) => setNewCustomerGst(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Billing Address
              </label>
              <Input
                placeholder="123 Wholesale Blvd, Suite 100"
                leftIcon={<MapPin className="h-4 w-4" />}
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createCustomerMutation.isPending}
            >
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
