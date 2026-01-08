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
        return 'bg-green-100 text-green-800';
      case 'Damaged':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In-Transit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string | number | boolean }) => (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '-'}
      </p>
    </div>
  );

  const handlePrint = () => {
    if (!printRef.current) return;
    window.print();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <style>{`
  @media print {
    /* 1. LAYOUT RESET - CRITICAL FIX */
    /* Forces the content to flow naturally from the top, disabling screen centering */
    html, body, #root, .min-h-screen {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      display: block !important;
      position: static !important;
      overflow: visible !important;
    }

    @page {
      size: auto; /* Let the printer determine size, or use 8.5in 11in */
      margin: 0mm; /* Remove browser header/footer text */
    }

    body {
      margin: 0 !important;
      padding: 0.5cm !important; /* Add slight padding so text doesn't hit edge */
      background: white;
    }

    /* Reset all elements to avoid hidden margins */
    * {
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }

    /* 2. TYPOGRAPHY SCALING */
    /* Adjusted sizes to be more reasonable for paper (36px is very large for print body text) */
    h1 {
      font-size: 24pt !important;
      margin-bottom: 8pt !important;
      font-weight: 800 !important;
      color: #000 !important;
    }
    h2, h3 {
      font-size: 18pt !important;
      margin-top: 12pt !important;
      margin-bottom: 6pt !important;
      font-weight: 700 !important;
      color: #000 !important;
    }
    p, .text-sm, .text-xs, span, div {
      font-size: 11pt !important; /* Standard readable print size */
      line-height: 1.4 !important;
      color: #000 !important;
    }
    
    /* 3. VISIBILITY CONTROLS */
    .print-hide {
      display: none !important;
    }
    .print-show {
      display: block !important;
    }
    
    /* 4. CARD STYLING REMOVAL */
    /* Flattens the card look for paper */
    .print-content {
      width: 100% !important;
      max-width: none !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
    }
    
    /* Target the Card component specifically if it has a border */
    .rounded-xl, .border, .shadow-sm {
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    /* 5. GRID & LAYOUT FIXES */
    .grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important; /* Force 2 columns for data */
      gap: 12pt !important;
    }
    /* Stack small grids if needed */
    .md\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
    }
      

    /* Avoid breaking elements in half across pages */
    .print-section-break {
      page-break-inside: avoid;
      margin-bottom: 16pt !important;
    }
  }
`}</style>
      <div className="max-w-4xl mx-auto">
        {/* Header - Hide on Print */}
        <div className="print-hide mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4 rounded-full">
            <img src={abelovLogo} alt="Abelov Logo" className="w-16 h-16" />
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">Product Details</h1>
              <p className="text-muted-foreground">Product ID: {request.id}</p>
            </div>
          </div>
          <div className="flex gap-2 print-hide">
            {/* Only show action buttons if logged 66in */}
            {user && (
              <>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => navigate(`/edit/${request.id}`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="print-content">
          {/* Print Header */}

          <div className="print-show mb-6 text-center hidden">
            <h1 className="text-2xl font-bold mb-1">Abelov Hub Records</h1>
            <p className="text-sm text-muted-foreground">Product Verification Report</p>
            <hr className="my-4" />
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
          </div>

          {/* Unified Form - All Sections in One */}
          <Card className="p-6">
            {/* Request Header */}
            <div className="mb-6 pb-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <DetailRow label="Record ID" value={request.id} />
                </div>
                <div>
                  <DetailRow label="Entry Date" value={new Date(request.entry_date).toLocaleDateString()} />
                </div>
                <div>
                  <DetailRow label="Status" value={request.status} />
                </div>
                <div>
                  <DetailRow label="Recorded By" value={request.recorder_name} />
                </div>
              </div>
            </div>

            {/* Product Photo */}
            {/* @ts-ignore */}
            {request.product_photo && (
              <div className="mb-6 pb-6 border-b print-section-break">
                <h3 className="text-lg font-semibold mb-3 text-primary">Product Photo</h3>
                <div className="flex justify-center">
                  {/* @ts-ignore */}
                  <img src={request.product_photo} alt="Product" className="max-w-full h-auto rounded-lg shadow-sm border" style={{ maxHeight: '400px' }} />
                </div>
              </div>
            )}

            {/* Product Information */}
            <div className="mb-6 pb-6 border-b print-section-break">
              <h3 className="text-lg font-semibold mb-3 text-primary">Product Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <DetailRow label="Product Name" value={request.product_name} />
                </div>
                <div>
                  <DetailRow label="Batch / Lot Number" value={request.batch_sku} />
                </div>
                <div>
                  <DetailRow label="Serial Number / Asset Tag" value={request.serial_number} />
                </div>
                {request.accessories_notes && (
                  <div className="md:col-span-3">
                    <DetailRow label="Included Materials / Notes" value={request.accessories_notes} />
                  </div>
                )}
              </div>
            </div>

            {/* Quality Check & Verification */}
            {(request.quality_check || request.action_taken) && (
              <div className="mb-6 pb-6 border-b print-section-break">
                <h3 className="text-lg font-semibold mb-3 text-primary">Quality Check & Verification</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {request.verification_date && (
                    <div>
                      <DetailRow label="QC Date" value={new Date(request.verification_date).toLocaleDateString()} />
                    </div>
                  )}
                  {request.verification_staff && (
                    <div>
                      <DetailRow label="QC Technician" value={request.verification_staff} />
                    </div>
                  )}
                </div>
                {request.quality_check && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground">Quality Check Report</p>
                    <p className="text-sm whitespace-pre-wrap">{request.quality_check}</p>
                  </div>
                )}
                {request.action_taken && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Corrective Actions Taken</p>
                    <p className="text-sm whitespace-pre-wrap">{request.action_taken}</p>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Summary */}
            <div className="mb-6 pb-6 border-b print-section-break">
              <h3 className="text-lg font-semibold mb-3 text-primary">Pricing & Logistics Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <DetailRow label="Hub Processing Fee" value={`₦${request.processing_fee.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Logistics / Add. Cost" value={`₦${request.additional_cost.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Total Value" value={`₦${request.total_value.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Amount Paid / Deposit" value={`₦${request.amount_paid.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Balance Due" value={`₦${request.balance.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Transaction Status" value={request.transaction_completed ? 'Finalized' : 'Pending'} />
                </div>
              </div>
            </div>

            {/* Confirmation */}
            {request.verification_confirmation && (
              <div className="pb-6 print-section-break">
                <h3 className="text-lg font-semibold mb-3 text-primary">Verification Confirmation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DetailRow label="Verified & Authorized" value={request.verification_confirmation.verified} />
                  </div>
                  <div>
                    <DetailRow label="Authorizing Officer" value={request.verification_confirmation.verifier_name} />
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps - Hide on Print */}
            <div className="print-hide text-xs text-muted-foreground mt-6 pt-4 border-t">
              <p>Entry Created: {new Date(request.created_at).toLocaleString()}</p>
              <p>Last Updated: {new Date(request.updated_at).toLocaleString()}</p>
            </div>

            {/* QR Code */}
            <div className="mt-6 pt-4 border-t text-center">
              <div className="flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-2">Verification QR Code</p>
                <QRCode
                  value={window.location.href}
                  size={128}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons - Hide on Print */}
        {/* Action Buttons - Mobile */}
        <div className="md:hidden flex flex-col gap-2 mt-6 print-hide">
          {user && (
            <>
              <Button variant="outline" onClick={handlePrint} className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={() => navigate(`/edit/${request.id}`)} className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
