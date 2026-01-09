import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePersistentFormState } from '@/hooks/usePersistentState';
import { persistentState } from '@/utils/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { serviceRequestAPI } from '@/lib/api';
import { HubRecord, LogTimelineStep } from '@/types/database';
import { Plus, Trash2, Loader2, LogOut, Home, FileImage, Upload, History, CreditCard } from 'lucide-react';
import abelovLogo from '@/assets/abelov-logo.png';

export default function ServiceRequestForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Default form data
  const getDefaultFormData = (): Partial<HubRecord> => ({
    recorder_name: '',
    entry_date: new Date().toISOString().split('T')[0],
    entity_name: '',
    entity_phone: '',
    entity_email: '',
    entity_address: '',
    product_name: '',
    product_category: 'Other', // Will be overridden by URL param
    batch_sku: '',
    serial_number: '',
    specifications: '',
    accessories_notes: '',
    record_description: '',
    verification_date: '',
    verification_staff: '',
    quality_check: '',
    materials_notes: '',
    action_taken: '',
    status: 'Pending',
    processing_fee: 0,
    additional_cost: 0,
    total_value: 0,
    amount_paid: 0,
    balance: 0,
    transaction_completed: false,
    is_dispatched: false,
    product_photo: null as string | null,
    log_timeline: [],
    verification_confirmation: {
      verified: false,
      verifier_name: '',
    },
  });

  // Persistent state for form data
  const [formData, setFormData] = usePersistentFormState(
    isEditMode ? `edit_form_${id}` : 'new_request_form',
    getDefaultFormData()
  );

  // Set category if provided in URL (only for new records)
  useEffect(() => {
    if (!isEditMode) {
      const type = searchParams.get('type');
      if (type === 'Student' || type === 'Internet') {
        setFormData(prev => {
          if (prev.product_category !== type) {
            const status = type === 'Internet' ? 'Active' : 'Pending';
            return { ...prev, product_category: type as any, status };
          }
          return prev;
        });
      }
    }
  }, [searchParams, isEditMode, setFormData]);

  // Timeline state
  const [timelineSteps, setTimelineSteps] = usePersistentFormState(
    isEditMode ? `edit_timeline_${id}` : 'new_request_timeline',
    [{ step: '', date: '', note: '', status: '' }]
  );

  useEffect(() => {
    if (isEditMode && id && user?.id) {
      loadRequest(id);
    } else {
      setLoading(false);
    }
  }, [id, user?.id, isEditMode]);

  const loadRequest = useCallback(async (requestId: string) => {
    try {
      const request = await serviceRequestAPI.getById(requestId);
      setFormData(request);
      setTimelineSteps(
        request.log_timeline && request.log_timeline.length > 0
          ? request.log_timeline
          : [{ step: '', date: '', note: '', status: '' }]
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load request';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const updateField = (field: keyof HubRecord, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateCosts = (service: number, parts: number, deposit: number) => {
    const total = service + parts;
    const balance = total - deposit;
    setFormData((prev) => ({
      ...prev,
      processing_fee: service,
      additional_cost: parts,
      total_value: total,
      amount_paid: deposit,
      balance: balance,
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const filteredTimeline = timelineSteps.filter((step) => step.step.trim() !== '');

      if (isEditMode && id) {
        const updateData: Partial<HubRecord> = {
          ...formData,
          log_timeline: filteredTimeline,
          updated_at: new Date().toISOString(),
        };
        await serviceRequestAPI.update(id, updateData);
        toast({
          title: 'Success!',
          description: `Hub Record ${id} has been updated.`,
        });
      } else {
        const newRequest = {
          user_id: user.id,
          recorder_name: formData.recorder_name || '',
          entry_date: formData.entry_date || new Date().toISOString().split('T')[0],
          entity_name: formData.entity_name || '',
          entity_phone: formData.entity_phone || '',
          entity_email: formData.entity_email || '',
          entity_address: formData.entity_address || '',
          product_name: formData.product_name || '',
          product_category: formData.product_category || 'Other',
          batch_sku: formData.batch_sku || '',
          serial_number: formData.serial_number || '',
          specifications: formData.specifications || '',
          accessories_notes: formData.accessories_notes || '',
          record_description: formData.record_description || '',
          status: (formData.status as string) || 'Pending',
          processing_fee: formData.processing_fee || 0,
          additional_cost: formData.additional_cost || 0,
          total_value: formData.total_value || 0,
          amount_paid: formData.amount_paid || 0,
          balance: formData.balance || 0,
          transaction_completed: formData.transaction_completed || false,
          product_photo: formData.product_photo || null,
        };
        await serviceRequestAPI.create(newRequest as unknown as Omit<HubRecord, 'id' | 'created_at' | 'updated_at'>);
        toast({
          title: 'Success!',
          description: 'Record has been created.',
        });
      }

      // Clear state
      if (!isEditMode) {
        persistentState.clearFormState('new_request_form');
        persistentState.clearFormState('new_request_timeline');
      }

      navigate('/dashboard');
    } catch (error: Error | unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save request';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getLabel = (field: string) => {
    const category = formData.product_category;
    if (category === 'Student') {
      if (field === 'entity_name') return 'Student Name';
      if (field === 'product_name') return 'Course / Program';
      if (field === 'entry_date') return 'Registration Date';
      if (field === 'specifications') return 'Duration / Level';
      if (field === 'batch_sku') return 'Student ID / Reg No';
      if (field === 'processing_fee') return 'Course Fee';
    } else if (category === 'Internet') {
      if (field === 'entity_name') return 'User Name';
      if (field === 'product_name') return 'Service Type';
      if (field === 'entry_date') return 'Date';
      if (field === 'specifications') return 'Duration / Time Usage';
      if (field === 'batch_sku') return 'Session ID';
      if (field === 'processing_fee') return 'Usage Fee';
    }
    // Default
    if (field === 'entity_name') return 'Source Entity / Name';
    if (field === 'product_name') return 'Product / Item Name';
    if (field === 'entry_date') return 'Entry Date';
    if (field === 'specifications') return 'Specifications';
    if (field === 'batch_sku') return 'Batch / SKU';
    if (field === 'processing_fee') return 'Service Fee';
    return '';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={abelovLogo} alt="Abelov Logo" className="w-12 rounded-3xl h-12" />
            <div>
              <h1 className="text-2xl font-bold text-primary">Abelov IT Academy</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="hidden md:flex">
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="md:hidden">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleLogout} className="hidden md:flex">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
            <Button variant="outline" onClick={handleLogout} className="md:hidden">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Main Form Card */}
          <Card className="p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-primary">
                {isEditMode ? 'Edit Record' : 'New Registration'}
              </h2>
              <div className="flex items-center gap-2">
                {/* Status Badge could go here */}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Core Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="entity_name">{getLabel('entity_name')}</Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => updateField('entity_name', e.target.value)}
                    placeholder="Name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product_name">{getLabel('product_name')}</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => updateField('product_name', e.target.value)}
                    placeholder="e.g. Course or Service"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry_date">{getLabel('entry_date')}</Label>
                    <Input
                      id="entry_date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => updateField('entry_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specifications">{getLabel('specifications')}</Label>
                    <Input
                      id="specifications"
                      value={formData.specifications}
                      onChange={(e) => updateField('specifications', e.target.value)}
                      placeholder="Duration / Time"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="batch_sku">{getLabel('batch_sku')}</Label>
                  <Input
                    id="batch_sku"
                    value={formData.batch_sku}
                    onChange={(e) => updateField('batch_sku', e.target.value)}
                    placeholder="Optional ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="accessories_notes">Notes / Comments</Label>
                  <Textarea
                    id="accessories_notes"
                    value={formData.accessories_notes}
                    onChange={(e) => updateField('accessories_notes', e.target.value)}
                    className="mt-1 h-20"
                  />
                </div>
              </div>

              {/* Right Column: Pricing & Photo */}
              <div className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-lg space-y-4 border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="text-gray-500 w-5 h-5" /> Payment & Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="processing_fee">{getLabel('processing_fee')}</Label>
                      <Input
                        id="processing_fee"
                        type="number"
                        value={formData.processing_fee}
                        onChange={(e) => calculateCosts(parseFloat(e.target.value) || 0, formData.additional_cost || 0, formData.amount_paid || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount_paid">Amount Paid</Label>
                      <Input
                        id="amount_paid"
                        type="number"
                        value={formData.amount_paid}
                        onChange={(e) => calculateCosts(formData.processing_fee || 0, formData.additional_cost || 0, parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Label>Balance:</Label>
                    <span className={`text-xl font-bold ${formData.balance! > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₦{formData.balance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => updateField('status', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Verified">Verified</SelectItem>
                        <SelectItem value="In-Transit">In-Progress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Photo Upload (Simplified) */}
                <div>
                  <Label>Photo / ID (Optional)</Label>
                  <div className="mt-2 text-center border-2 border-dashed border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    {/* @ts-ignore */}
                    {formData.product_photo ? (
                      <div className="relative">
                        {/* @ts-ignore */}
                        <img src={formData.product_photo} alt="Preview" className="mx-auto max-h-48 rounded shadow-sm" />
                        <Button
                          className="absolute top-0 right-0" variant="destructive" size="icon"
                          onClick={() => updateField('product_photo', null)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm cursor-pointer p-2">
                        <label htmlFor="simple-photo-upload" className="flex flex-col items-center cursor-pointer">
                          <Upload className="w-8 h-8 mb-2 opacity-50" />
                          <span>Click to Upload</span>
                        </label>
                        <Input
                          id="simple-photo-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => updateField('product_photo', reader.result);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t">
              <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEditMode ? 'Update Record' : 'Save Registration'}
              </Button>
            </div>
          </Card>

          {/* Timeline (Only for Edit) */}
          {isEditMode && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5" /> Activity Log
              </h3>
              {/* Timeline UI could be simplified or kept as list */}
              <div className="space-y-4">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start text-sm border-b pb-2">
                    <span className="font-mono text-xs text-gray-500 w-24">{step.date || 'No Date'}</span>
                    <div className="flex-1">
                      <p className="font-medium">{step.step || 'Log Entry'}</p>
                      <p className="text-gray-600">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
