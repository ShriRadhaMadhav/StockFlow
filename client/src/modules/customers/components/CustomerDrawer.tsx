import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Hash } from 'lucide-react';
import { Drawer } from '../../../components/ui/drawer/Drawer';
import { Input } from '../../../components/ui/input/Input';
import { Button } from '../../../components/ui/button/Button';
import { customerApi } from '../../../services/api/customer.api';

interface CustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerDrawer({ isOpen, onClose }: CustomerDrawerProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string; address?: string; gstNumber?: string }) => {
      return customerApi.createCustomer(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      resetForm();
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create customer');
    }
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setGstNumber('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer"
      description="Add a new customer profile to log sales invoices and receive payments."
    >
      <form onSubmit={handleSubmit} className="space-y-5 h-full flex flex-col justify-between">
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Customer Name *</label>
            <Input
              required
              placeholder="e.g. Acme Corporation"
              leftIcon={<User className="h-4 w-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Email Address</label>
            <Input
              type="email"
              placeholder="e.g. billing@acme.com"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Phone Number</label>
            <Input
              placeholder="e.g. +1 (555) 019-2834"
              leftIcon={<Phone className="h-4 w-4" />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Tax Identification / GST Number</label>
            <Input
              placeholder="e.g. GSTIN12345"
              leftIcon={<Hash className="h-4 w-4" />}
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Billing Address</label>
            <Input
              placeholder="e.g. 100 Corporate Pkwy, Suite 500"
              leftIcon={<MapPin className="h-4 w-4" />}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-6 border-t border-border mt-auto">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={createMutation.isPending}
          >
            Save Customer
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
