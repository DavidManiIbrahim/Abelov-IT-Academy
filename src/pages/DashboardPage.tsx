import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { serviceRequestAPI, adminAPI } from '@/lib/api';
import { HubRecord } from '@/types/database';
import { Plus, Search, Edit, Eye, Trash2, BarChart3, Shield, GraduationCap, Wifi, Package } from 'lucide-react';
import ProfileMenu from '@/components/ProfileMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import abelovLogo from '@/assets/abelov-logo.png';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const getUsername = () => {
    // @ts-ignore
    return user?.username || localStorage.getItem('userUsername') || '';
  };
  const [requests, setRequests] = useState<HubRecord[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<HubRecord[]>([]);
  const [searchQuery, setSearchQuery] = usePersistentState('dashboard_search', '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sold: 0,
    verified: 0,
    pending: 0,
    inTransit: 0,
    damaged: 0,
    totalRevenue: 0,
  });

  const loadRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [requestsData, statsData] = await Promise.all([
        serviceRequestAPI.getByUserId(user.id),
        serviceRequestAPI.getStats(user.id),
      ]);
      setRequests(requestsData || []);
      setFilteredRequests(requestsData || []);

      // Map global stats to expected format
      setStats({
        total: statsData.total || 0,
        sold: statsData.completed || 0, // Using completed as sold/finished
        totalRevenue: statsData.totalRevenue || 0,
      });
    } catch (error) {
      console.error('Error loading requests:', error);
      // Fallback: try to load just requests if stats fail
      try {
        const data = await serviceRequestAPI.getByUserId(user.id);
        setRequests(data || []);
        setFilteredRequests(data || []);

        // Try to get global stats as fallback
        try {
          const stats = await serviceRequestAPI.getStats(user.id);
          setStats({
            total: stats.total || 0,
            sold: stats.completed || 0,
            totalRevenue: stats.totalRevenue || 0,
          });
        } catch {
          // Calculate stats locally from loaded requests as last resort
          const loadedRequests = data.records || [];
          const calculatedStats = loadedRequests.reduce(
            (acc, request) => {
              acc.total++;
              acc.totalRevenue += request.total_value || 0;
              if (request.is_dispatched) acc.sold++;

              switch (request.status) {
                case 'Verified':
                  acc.verified++;
                  break;
                case 'Pending':
                  acc.pending++;
                  break;
                case 'In-Transit':
                  acc.inTransit++;
                  break;
                case 'Damaged':
                  acc.damaged++;
                  break;
              }

              return acc;
            },
            {
              total: 0,
              sold: 0,
              verified: 0,
              pending: 0,
              inTransit: 0,
              damaged: 0,
              totalRevenue: 0,
            }
          );

          setStats(calculatedStats);
        }
      } catch (fallbackError) {
        console.error('Fallback request loading also failed:', fallbackError);
        setRequests([]);
        setFilteredRequests([]);
        setStats({
          total: 0,
          sold: 0,
          verified: 0,
          pending: 0,
          inTransit: 0,
          damaged: 0,
          totalRevenue: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!user?.id) return;

    if (query.trim() === '') {
      setFilteredRequests(requests);
    } else {
      try {
        const results = await serviceRequestAPI.search(user.id, query);
        setFilteredRequests(results || []);
      } catch (error) {
        console.error('Error searching:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product record?')) return;
    try {
      await serviceRequestAPI.delete(id);
      setRequests(requests.filter(r => r.id !== id));
      setFilteredRequests(filteredRequests.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified':
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In-Transit':
      case 'Active':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Damaged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, trend }: { title: string; value: string | number; trend?: string }) => (
    <Card className="p-6">
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
      {trend && <p className="text-xs text-green-600 mt-2">{trend}</p>}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={abelovLogo} alt="Abelov Logo" className="w-12 rounded-3xl h-12" />
            <div>
              <h1 className="text-2xl font-bold text-primary dark:text-black">Abelov IT Academy</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => navigate('/analytics')} variant="outline" className="md:flex hidden">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={() => navigate('/analytics')} variant="outline" className="md:hidden">
              <BarChart3 className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <>
                <Button onClick={() => navigate('/admin')} variant="outline" className="md:flex hidden">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
                <Button onClick={() => navigate('/admin')} variant="outline" className="md:hidden">
                  <Shield className="w-4 h-4" />
                </Button>
              </>
            )}
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome back{getUsername() ? `, ${getUsername()}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your product entries and verification metrics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Total Products" value={stats.total} />
          <StatCard title="Total Sold" value={stats.sold} />
          <StatCard title="Total Revenue" value={`₦${(stats.totalRevenue || 0).toLocaleString()}`} />
        </div>

        {/* Search and Create */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by product name, batch, product ID, or status..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size="lg" className="md:flex hidden">
            <Plus className="w-4 h-4 mr-2" />
            Add Request
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} size="lg" className="md:hidden">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading records...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No Results Found' : 'No Product Records Yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search query.' : 'Add your first product to get started.'}
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Request
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Product ID</p>
                    <p className="font-mono font-semibold text-primary text-sm">{request.id}</p>
                  </div>
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p><span className="font-medium">Product:</span> {request.product_name}</p>
                  <p><span className="font-medium">Name:</span> {request.entity_name || '-'}</p>
                  <p><span className="font-medium">Entry Date:</span> {new Date(request.entry_date).toLocaleDateString()}</p>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                      <p className="font-bold text-primary">₦{request.total_value.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className={`font-bold ${request.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₦{request.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/view/${request.id}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex hidden"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => navigate(`/view/${request.id}`)}
                    variant="outline"
                    size="sm"
                    className="md:hidden"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => navigate(`/edit/${request.id}`)}
                    variant="default"
                    size="sm"
                    className="flex-1 md:flex hidden"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => navigate(`/edit/${request.id}`)}
                    variant="default"
                    size="sm"
                    className="md:hidden"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(request.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>


      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Request Type</DialogTitle>
            <DialogDescription>
              Choose the type of record you want to create.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              variant="outline"
              className="h-20 justify-start px-6 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all group"
              onClick={() => navigate('/?type=Student')}
            >
              <div className="bg-blue-100 p-2 rounded-full mr-4 group-hover:bg-blue-200">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Student Registration</div>
                <div className="text-xs text-muted-foreground">Register new student</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-20 justify-start px-6 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all group"
              onClick={() => navigate('/?type=Internet')}
            >
              <div className="bg-green-100 p-2 rounded-full mr-4 group-hover:bg-green-200">
                <Wifi className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Internet User</div>
                <div className="text-xs text-muted-foreground">Track internet usage time</div>
              </div>
            </Button>


          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
