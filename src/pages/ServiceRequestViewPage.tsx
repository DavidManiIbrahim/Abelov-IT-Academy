import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { serviceRequestAPI } from '@/lib/api';
import { HubRecord } from '@/types/database';
import { ArrowLeft, Loader2, Printer, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import QRCode from 'react-qr-code';
import abelovLogo from '@/assets/abelov-logo.png';

export default function ServiceRequestViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [request, setRequest] = useState<HubRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRequest = useCallback(async (requestId: string) => {
    try {
      const data = await serviceRequestAPI.getById(requestId);
      setRequest(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load request',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (id) {
      loadRequest(id);
    }
  }, [id, loadRequest]);

  const getLabel = (field: string, category: string = 'Other') => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Request Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified':
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Damaged':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In-Transit':
      case 'Active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string | number | boolean }) => (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '-'}
      </p>
    </div>
  );

  const handlePrint = () => {
    window.print();
  };

  const category = request.product_category || 'Other';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <style>{`
        @media print {
            body { background: white; -webkit-print-color-adjust: exact; }
            .print-hide { display: none !important; }
            .print-card { box-shadow: none !important; border: none !important; }
            @page { margin: 0.5cm; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header - Hide on Print */}
        <div className="print-hide mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={abelovLogo} alt="Abelov Logo" className="w-16 h-16 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-primary">Record Details</h1>
              <p className="text-muted-foreground">ID: {request.id}</p>
            </div>
          </div>
          <div className="flex gap-2 print-hide">
            {user && (
              <>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button onClick={() => navigate(`/edit/${request.id}`)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="print-card bg-white">
          {/* Print Header */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-3xl font-bold">Abelov IT Academy</h1>
            <p className="text-gray-500">Record Verification</p>
          </div>

          <Card className="p-6 print-card">
            <div className="flex justify-between items-start mb-6 pb-6 border-b">
              <div>
                <Badge className={`mb-2 ${getStatusColor(request.status)}`}>{request.status}</Badge>
                <h2 className="text-2xl font-bold">{request.entity_name}</h2>
                <p className="text-gray-500">{getLabel('entity_name', category)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Recorded on</p>
                <p className="font-semibold">{new Date(request.entry_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Information</h3>
                <DetailRow label={getLabel('product_name', category)} value={request.product_name} />
                <DetailRow label={getLabel('specifications', category)} value={request.specifications} />
                <DetailRow label={getLabel('batch_sku', category)} value={request.batch_sku} />

                {request.product_photo && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Photo / ID</p>
                    <img src={request.product_photo} alt="Record" className="rounded-lg max-h-48 border shadow-sm" />
                  </div>
                )}

                {request.accessories_notes && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">{request.accessories_notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Financials & Verification */}
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Financials</h3>
                <DetailRow label={getLabel('processing_fee', category)} value={`₦${request.processing_fee?.toFixed(2) || '0.00'}`} />
                {request.additional_cost > 0 && (
                  <DetailRow label="Additional Cost" value={`₦${request.additional_cost?.toFixed(2) || '0.00'}`} />
                )}
                <DetailRow label="Amount Paid" value={`₦${request.amount_paid?.toFixed(2) || '0.00'}`} />

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Balance Due</p>
                  <p className={`text-2xl font-bold ${request.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₦{request.balance?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t print:hidden">
                  <h3 className="text-lg font-semibold mb-3">Verification</h3>
                  <div className="flex justify-center p-4 bg-white border rounded-lg">
                    <QRCode value={window.location.href} size={100} />
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-2">Scan to verify record</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
