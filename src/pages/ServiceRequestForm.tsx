import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Plus, Trash2, Loader2, LogOut, Home, FileImage, Upload } from 'lucide-react';
import { FaStore, FaUser, FaBox, FaExclamationTriangle, FaTools, FaMoneyBill, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import abelovLogo from '@/assets/abelov-logo.png';



const FORM_STEPS = [
  { id: 'product', title: 'Product Information', icon: FaBox },
  { id: 'photo', title: 'Product Photo', icon: FileImage },
  { id: 'diagnosis', title: 'Quality Check & Verification', icon: FaTools },
  { id: 'costs', title: 'Pricing Summary', icon: FaMoneyBill },
  { id: 'confirmation', title: 'Confirmation', icon: FaCheckCircle },
];

export default function ServiceRequestForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Persistent state for form progress (only for new forms, not edits)
  const [currentStep, setCurrentStep] = usePersistentFormState(
    isEditMode ? `edit_step_${id}` : 'new_request_step',
    0
  );

  // Safety check for step bounds (prevents crash on stale state)
  const safeStep = currentStep >= FORM_STEPS.length ? 0 : currentStep;

  useEffect(() => {
    if (currentStep >= FORM_STEPS.length) {
      setCurrentStep(0);
    }
  }, [currentStep, setCurrentStep]);

  // Default form data
  const getDefaultFormData = (): Partial<HubRecord> => ({
    recorder_name: '',
    entry_date: new Date().toISOString().split('T')[0],
    entity_name: '',
    entity_phone: '',
    entity_email: '',
    entity_address: '',
    product_name: '',
    product_category: 'Other',
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

  // Persistent state for form data (only for new forms)
  const [formData, setFormData] = usePersistentFormState(
    isEditMode ? `edit_form_${id}` : 'new_request_form',
    getDefaultFormData()
  );

  // Persistent state for timeline steps
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
        request.repair_timeline && request.repair_timeline.length > 0
          ? request.repair_timeline
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

  const addTimelineStep = () => {
    setTimelineSteps([...timelineSteps, { step: '', date: '', note: '', status: '' }]);
  };

  const removeTimelineStep = (index: number) => {
    setTimelineSteps(timelineSteps.filter((_, i) => i !== index));
  };

  const updateTimelineStep = (index: number, field: keyof LogTimelineStep, value: string) => {
    const updated = [...timelineSteps];
    updated[index] = { ...updated[index], [field]: value };
    setTimelineSteps(updated);
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
        };
        await serviceRequestAPI.create(newRequest as unknown as Omit<HubRecord, 'id' | 'created_at' | 'updated_at'>);
        toast({
          title: 'Success!',
          description: 'Hub Record has been created.',
        });
      }

      // Clear persistent form state on successful submission
      if (!isEditMode) {
        persistentState.clearFormState('new_request_form');
        persistentState.clearFormState('new_request_step');
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


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleNext = () => {
    // For new requests, stop at Product Photo (index 1) and submit.
    if (!isEditMode && currentStep === 1) {
      handleSubmit();
      return;
    }

    // All fields are optional - just proceed to next step
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderStepContent = () => {
    switch (safeStep) {
      case 0:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Core Record Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="entity_name">Source Entity / Customer Name</Label>
                <Input
                  id="entity_name"
                  value={formData.entity_name}
                  onChange={(e) => updateField('entity_name', e.target.value)}
                  placeholder="Supplier Name or Client Name"
                />
              </div>
              <div>
                <Label htmlFor="product_name">Product Item Name</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => updateField('product_name', e.target.value)}
                  placeholder="e.g. Solar Panel 400W"
                />
              </div>
              <div>
                <Label htmlFor="batch_sku">Batch Number / SKU</Label>
                <Input
                  id="batch_sku"
                  value={formData.batch_sku}
                  onChange={(e) => updateField('batch_sku', e.target.value)}
                  placeholder="e.g. BATCH-2024-X"
                />
              </div>
              <div>
                <Label htmlFor="recorder_name">Recorded By</Label>
                <Input
                  id="recorder_name"
                  value={formData.recorder_name}
                  onChange={(e) => updateField('recorder_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="entry_date">Entry Date</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => updateField('entry_date', e.target.value)}
                />
              </div>
            </div>
          </Card>
        );
      case 1:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Product Logistics & Details</h2>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-10 bg-gray-50 hover:bg-gray-100 transition-colors">
              {/* @ts-ignore */}
              {formData.product_photo ? (
                <div className="relative w-full max-w-md">
                  {/* @ts-ignore */}
                  <img src={formData.product_photo} alt="Product Preview" className="w-full h-auto rounded-lg shadow-md" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => updateField('product_photo', null)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <Upload className="w-12 h-12 text-gray-400" />
                  </div>
                  <Label htmlFor="photo_upload" className="cursor-pointer">
                    <span className="text-primary font-semibold hover:underline">Click to upload product photo</span> or drag and drop
                    <br />
                    <span className="text-sm text-muted-foreground">Dimensions: 800x400 max recommended</span>
                  </Label>
                  <Input
                    id="photo_upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateField('product_photo', reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <Label htmlFor="serial_number">Serial Number / Asset Tag</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => updateField('serial_number', e.target.value)}
                  placeholder="Unique ID"
                />
              </div>
              <div>
                <Label htmlFor="product_category">Category</Label>
                <Select
                  value={formData.product_category}
                  onValueChange={(value) => updateField('product_category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Consumer Goods">Consumer Goods</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="specifications">Specifications / Model Data</Label>
              <Input
                id="specifications"
                value={formData.specifications}
                onChange={(e) => updateField('specifications', e.target.value)}
                placeholder="Storage, CPU, Dimensions, etc."
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="accessories_notes">Included Materials / Accessories</Label>
              <Textarea
                id="accessories_notes"
                value={formData.accessories_notes}
                onChange={(e) => updateField('accessories_notes', e.target.value)}
                placeholder="Cables, Remotes, Documentation..."
              />
            </div>
          </Card>
        );
      case 2:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Quality Check & Verification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="verification_date">Verification Date</Label>
                <Input
                  id="verification_date"
                  type="date"
                  value={formData.verification_date}
                  onChange={(e) => updateField('verification_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="verification_staff">Verification Staff</Label>
                <Input
                  id="verification_staff"
                  value={formData.verification_staff}
                  onChange={(e) => updateField('verification_staff', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="quality_check">Quality Check Report</Label>
                <Textarea
                  id="quality_check"
                  value={formData.quality_check}
                  onChange={(e) => updateField('quality_check', e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="action_taken">Corrective Actions Taken</Label>
                <Textarea
                  id="action_taken"
                  value={formData.action_taken}
                  onChange={(e) => updateField('action_taken', e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div>
                <Label htmlFor="status">Current Record Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In-Transit">In-Transit</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        );
      case 3:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Pricing & Logistics Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="processing_fee">Hub Processing Fee</Label>
                <Input
                  id="processing_fee"
                  type="number"
                  step="0.01"
                  value={formData.processing_fee}
                  onChange={(e) =>
                    calculateCosts(
                      parseFloat(e.target.value) || 0,
                      formData.additional_cost || 0,
                      formData.amount_paid || 0
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="additional_cost">Logistics / Add. Cost</Label>
                <Input
                  id="additional_cost"
                  type="number"
                  step="0.01"
                  value={formData.additional_cost}
                  onChange={(e) =>
                    calculateCosts(
                      formData.processing_fee || 0,
                      parseFloat(e.target.value) || 0,
                      formData.amount_paid || 0
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="amount_paid">Amount Paid / Deposit</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  value={formData.amount_paid}
                  onChange={(e) =>
                    calculateCosts(
                      formData.processing_fee || 0,
                      formData.additional_cost || 0,
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-accent rounded-md">
                <Label>Total Value / Cost</Label>
                <p className="text-2xl font-bold text-primary">₦{formData.total_value?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="p-4 bg-accent rounded-md">
                <Label>Outstanding balance</Label>
                <p className={`text-2xl font-bold ${formData.balance! > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₦{formData.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transaction_completed"
                  checked={formData.transaction_completed}
                  onCheckedChange={(checked) => updateField('transaction_completed', checked)}
                />
                <Label htmlFor="transaction_completed">Transaction Finalized</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_dispatched"
                  checked={formData.is_dispatched}
                  onCheckedChange={(checked) => updateField('is_dispatched', checked)}
                />
                <Label htmlFor="is_dispatched" className="text-primary font-bold">Mark as Dispatched / Sold</Label>
              </div>
            </div>
          </Card>
        );
      case 4:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Verification Confirmation</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={formData.verification_confirmation?.verified}
                  onCheckedChange={(checked) =>
                    updateField('verification_confirmation', {
                      ...formData.verification_confirmation,
                      verified: checked,
                    })
                  }
                />
                <Label htmlFor="verified">Product Verified & Authorized for Release</Label>
              </div>
              <div>
                <Label htmlFor="verifier_name">Authorizing Officer</Label>
                <Input
                  id="verifier_name"
                  value={formData.verification_confirmation?.verifier_name}
                  onChange={(e) =>
                    updateField('verification_confirmation', {
                      ...formData.verification_confirmation,
                      verifier_name: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with User Info and Logout */}
      <div className="border-b bg-card p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">

            <img src={abelovLogo} alt="Abelov Logo" className="w-12 rounded-3xl h-12" />
            <div>
              <h1 className="text-2xl font-bold text-primary">Abelov Hub Records</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="md:flex hidden">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="md:hidden">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleLogout} className="md:flex hidden">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button variant="outline" onClick={handleLogout} className="md:hidden">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {(() => {
                  const Icon = FORM_STEPS[safeStep]?.icon || FaBox;
                  // @ts-ignore
                  return <Icon className="w-5 h-5" />;
                })()}
                {FORM_STEPS[safeStep]?.title}
              </h2>
              <span className="text-sm text-muted-foreground">
                Step {safeStep + 1} of {FORM_STEPS.length}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((safeStep + 1) / FORM_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Steps */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={safeStep === 0}
                >
                  ← Back
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>
              <Button
                onClick={() => {
                  if (!isEditMode && safeStep === 1) {
                    handleSubmit();
                  } else if (safeStep === FORM_STEPS.length - 1) {
                    handleSubmit();
                  } else {
                    handleNext();
                  }
                }}
                size="lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Submitting...'}
                  </>
                ) : !isEditMode && safeStep === 1 ? (
                  'Submit Request'
                ) : safeStep === FORM_STEPS.length - 1 ? (
                  isEditMode ? 'Update & Submit' : 'Submit'
                ) : (
                  'Next →'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
