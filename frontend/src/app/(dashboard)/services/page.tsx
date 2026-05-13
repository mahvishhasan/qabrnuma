'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { TableSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FuneralService } from '@/types';
import {
  PlusIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  XMarkIcon,
  SparklesIcon,
  TruckIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface DeathCase {
  case_id: number;
  registration_number: string;
  deceased_name: string;
}

interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  category: 'religious' | 'logistics' | 'cemetery' | 'memorial' | 'maintenance';
  price: number;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SERVICE_CATALOG: ServiceCatalogItem[] = [
  { id: 'ghusl', name: 'Ghusl (Ritual Washing)', description: 'Traditional Islamic ritual washing performed with care and dignity', category: 'religious', price: 5000, duration: '1-2 hours', icon: SparklesIcon },
  { id: 'kafan', name: 'Kafan (Shroud)', description: 'Quality white shroud cloth prepared according to Islamic tradition', category: 'religious', price: 3500, duration: '30-45 mins', icon: SparklesIcon },
  { id: 'janaza', name: 'Janaza Prayer Coordination', description: 'Coordination of funeral prayer arrangements at mosque or cemetery', category: 'religious', price: 2000, duration: '1 hour', icon: SparklesIcon },
  { id: 'transport', name: 'Body Transport', description: 'Dignified transportation from hospital/home to cemetery', category: 'logistics', price: 8000, duration: 'Depends on distance', icon: TruckIcon },
  { id: 'grave_prep', name: 'Grave Preparation', description: 'Professional grave digging and preparation services', category: 'cemetery', price: 6000, duration: '2-3 hours', icon: MapPinIcon },
  { id: 'headstone', name: 'Headstone / Memorial Marker', description: 'Custom engraved headstone with name, dates, and Quranic verses', category: 'memorial', price: 25000, duration: '3-5 business days', icon: HeartIcon },
  { id: 'cleaning', name: 'Grave Cleaning & Maintenance', description: 'One-time cleaning of grave site and surroundings', category: 'maintenance', price: 1500, duration: '1 hour', icon: WrenchScrewdriverIcon },
  { id: 'perpetual', name: 'Perpetual Care Plan', description: 'Annual maintenance plan for grave upkeep and landscaping', category: 'maintenance', price: 12000, duration: 'Annual', icon: WrenchScrewdriverIcon },
];

const CATEGORIES = ['all', 'religious', 'logistics', 'cemetery', 'memorial', 'maintenance'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  religious: 'Religious',
  logistics: 'Logistics',
  cemetery: 'Cemetery',
  memorial: 'Memorial',
  maintenance: 'Maintenance',
};

export default function ServicesPage() {
  const { user } = useAuth();
  const role = user?.role || 'user';

  if (role === 'user') {
    return <UserServicesView />;
  }

  if (role === 'staff') {
    return <StaffAssignedView />;
  }

  return <CoordinatorServicesView />;
}

function UserServicesView() {
  const [activeTab, setActiveTab] = useState<'book' | 'my'>('book');
  const [category, setCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [deathCases, setDeathCases] = useState<DeathCase[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    case_id: '',
    preferred_datetime: '',
    notes: '',
  });
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchDeathCases();
  }, []);

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyBookings();
    }
  }, [activeTab]);

  const fetchDeathCases = async () => {
    try {
      const res = await api.get('/death-cases/my-cases?limit=100');
      setDeathCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to fetch death cases:', err);
    }
  };

  const fetchMyBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await api.get('/funeral-services/my-requests');
      setMyBookings(res.data.services || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setMyBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleBookService = async () => {
    if (!selectedService || !bookingForm.case_id) return;

    setIsSubmitting(true);
    try {
      await api.post('/funeral-services/request', {
        service_type: selectedService.id,
        case_id: parseInt(bookingForm.case_id),
        preferred_datetime: bookingForm.preferred_datetime || null,
        notes: bookingForm.notes || null,
        price: selectedService.price,
      });
      setToast('Service booked. Our coordinator will confirm shortly.');
      setSelectedService(null);
      setBookingForm({ case_id: '', preferred_datetime: '', notes: '' });
      setTimeout(() => setToast(''), 4000);
    } catch (err: any) {
      console.error('Failed to book service:', err);
      setToast(err.response?.data?.error || 'Failed to book service');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = category === 'all'
    ? SERVICE_CATALOG
    : SERVICE_CATALOG.filter(s => s.category === category);

  return (
    <div>
      <Header title="Services" />

      <div className="p-6 lg:p-8">
        {toast && (
          <div className="fixed top-20 right-6 bg-[#2D6A4F] text-white px-4 py-3 rounded-lg shadow-lg z-50">
            {toast}
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'book'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Book a Service
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'my'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Bookings
          </button>
        </div>

        {activeTab === 'book' && (
          <>
            <p className="text-gray-600 mb-6">
              Arrange everything your loved one deserves, in one place.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {filteredServices.map((service) => (
                <div key={service.id} className="card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#2D6A4F]/10 rounded-lg">
                      <service.icon className="w-6 h-6 text-[#2D6A4F]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-lg font-bold text-[#2D6A4F]">
                          PKR {service.price.toLocaleString()}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                          {service.duration}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedService(service)}
                        className="btn-primary mt-4 text-sm"
                      >
                        Book This Service
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'my' && (
          <div className="card">
            {isLoadingBookings ? (
              <TableSkeleton rows={4} columns={4} />
            ) : myBookings.length === 0 ? (
              <EmptyState
                title="No services booked yet"
                description="Book your first service to get started."
                icon={CalendarDaysIcon}
                action={
                  <button onClick={() => setActiveTab('book')} className="btn-primary">
                    Book Your First Service
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3 text-left">Service</th>
                      <th className="px-4 py-3 text-left">Linked Case</th>
                      <th className="px-4 py-3 text-left">Preferred Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBookings.map((booking) => (
                      <tr key={booking.service_id} className="table-row">
                        <td className="px-4 py-3 font-medium text-gray-900 capitalize">
                          {booking.service_type?.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {booking.registration_number || `Case #${booking.case_id}`}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {booking.preferred_datetime
                            ? format(new Date(booking.preferred_datetime), 'MMM dd, yyyy HH:mm')
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {selectedService && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Book Service</h2>
                <button onClick={() => setSelectedService(null)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedService.name}</p>
                <p className="text-sm text-gray-500">{selectedService.duration}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Link to Death Case *</label>
                  <select
                    value={bookingForm.case_id}
                    onChange={(e) => setBookingForm({ ...bookingForm, case_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a case</option>
                    {deathCases.map((dc) => (
                      <option key={dc.case_id} value={dc.case_id}>
                        {dc.registration_number} - {dc.deceased_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Preferred Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.preferred_datetime}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferred_datetime: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Additional Notes</label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Any special requests or instructions..."
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500">Total Price</span>
                  <span className="text-xl font-bold text-[#2D6A4F]">
                    PKR {selectedService.price.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleBookService}
                  disabled={!bookingForm.case_id || isSubmitting}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StaffUser {
  user_id: number;
  full_name: string;
}

function StaffAssignedView() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssignedServices();
  }, []);

  const fetchAssignedServices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/funeral-services/my-assigned');
      const sorted = (res.data.services || []).sort((a: any, b: any) => {
        if (!a.scheduled_datetime) return 1;
        if (!b.scheduled_datetime) return -1;
        return new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime();
      });
      setServices(sorted);
    } catch (err) {
      console.error('Failed to fetch assigned services:', err);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduledCount = services.filter(s => s.status === 'scheduled').length;
  const inProgressCount = services.filter(s => s.status === 'in_progress').length;

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'ghusl': return SparklesIcon;
      case 'transport': return TruckIcon;
      default: return CalendarDaysIcon;
    }
  };

  return (
    <div>
      <Header title="My Assigned Services" />

      <div className="p-6 lg:p-8">
        <div className="flex gap-3 mb-6">
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {scheduledCount} Scheduled
          </span>
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            {inProgressCount} In Progress
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            title="No services assigned to you yet"
            description="When a coordinator assigns you a service, it will appear here."
            icon={CalendarDaysIcon}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = getServiceIcon(service.service_type);
              return (
                <div key={service.service_id} className="card relative">
                  <StatusBadge status={service.status} className="absolute top-4 right-4" />
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#2D6A4F]/10 rounded-lg">
                      <Icon className="w-5 h-5 text-[#2D6A4F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {service.service_type?.replace('_', ' ')}
                      </h3>
                      <Link
                        href={`/death-cases/${service.case_id}`}
                        className="text-sm text-[#2D6A4F] hover:underline"
                      >
                        {service.registration_number || `Case #${service.case_id}`}
                      </Link>
                    </div>
                  </div>
                  {service.scheduled_datetime && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4" />
                      {format(new Date(service.scheduled_datetime), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                  <Link
                    href={`/services/${service.service_id}`}
                    className="btn-secondary w-full mt-4 text-sm"
                  >
                    View Details
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CoordinatorServicesView() {
  const { user } = useAuth();
  const [services, setServices] = useState<FuneralService[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [filters, setFilters] = useState({
    service_type: '',
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [assignModal, setAssignModal] = useState<{ open: boolean; serviceId: number | null }>({
    open: false,
    serviceId: null,
  });
  const [assignForm, setAssignForm] = useState({
    scheduled_datetime: '',
    assigned_staff_id: '',
  });
  const [isAssigning, setIsAssigning] = useState(false);

  const [rejectModal, setRejectModal] = useState<{ open: boolean; serviceId: number | null }>({
    open: false,
    serviceId: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const canCreate = user?.role === 'admin' || user?.role === 'funeral_coordinator';

  useEffect(() => {
    fetchServices();
    fetchStaff();
  }, [pagination.page, filters]);

  const fetchServices = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filters.service_type) params.append('service_type', filters.service_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/funeral-services?${params}`);
      setServices(res.data.services || []);
      setPagination(res.data.pagination || pagination);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setError('Failed to load services');
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users?role=staff');
      setStaffList(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleAssign = async () => {
    if (!assignModal.serviceId || !assignForm.scheduled_datetime || !assignForm.assigned_staff_id) return;
    setIsAssigning(true);
    try {
      await api.put(`/funeral-services/${assignModal.serviceId}/schedule`, {
        scheduled_datetime: assignForm.scheduled_datetime,
        assigned_staff_id: parseInt(assignForm.assigned_staff_id),
      });
      setToast('Service scheduled and staff assigned');
      setAssignModal({ open: false, serviceId: null });
      setAssignForm({ scheduled_datetime: '', assigned_staff_id: '' });
      fetchServices();
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      setToast(err.response?.data?.error || 'Failed to assign service');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.serviceId || !rejectionReason) return;
    setIsRejecting(true);
    try {
      await api.put(`/funeral-services/${rejectModal.serviceId}/reject`, {
        rejection_reason: rejectionReason,
      });
      setToast('Service rejected');
      setRejectModal({ open: false, serviceId: null });
      setRejectionReason('');
      fetchServices();
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      setToast(err.response?.data?.error || 'Failed to reject service');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div>
      <Header title="Services" />

      <div className="p-6 lg:p-8">
        {toast && (
          <div className={`fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.includes('Failed') ? 'bg-red-500 text-white' : 'bg-[#2D6A4F] text-white'
          }`}>
            {toast}
          </div>
        )}

        <div className="card mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <label className="label">Service Type</label>
              <select
                value={filters.service_type}
                onChange={(e) => setFilters({ ...filters, service_type: e.target.value })}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="ghusl">Ghusl</option>
                <option value="kafan">Kafan</option>
                <option value="janaza">Janaza</option>
                <option value="transport">Transport</option>
                <option value="grave_prep">Grave Prep</option>
                <option value="headstone">Headstone</option>
                <option value="cleaning">Cleaning</option>
                <option value="perpetual">Perpetual Care</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="w-48">
              <label className="label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field pl-9"
                  placeholder="Search by case ID or name..."
                />
              </div>
            </div>
            <button onClick={handleSearch} className="btn-primary">
              Search
            </button>
            {canCreate && (
              <Link href="/services/create" className="btn-primary">
                <PlusIcon className="w-4 h-4" />
                Schedule Service
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : error ? (
            <EmptyState
              title="Error loading services"
              description={error}
              icon={CalendarDaysIcon}
            />
          ) : services.length === 0 ? (
            <EmptyState
              title="No services found"
              description="No funeral services match your filters."
              icon={CalendarDaysIcon}
              action={
                canCreate ? (
                  <Link href="/services/create" className="btn-primary">
                    <PlusIcon className="w-4 h-4" />
                    Schedule Service
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Service ID</th>
                    <th className="px-4 py-3 text-left">Case ID</th>
                    <th className="px-4 py-3 text-left">Service Type</th>
                    <th className="px-4 py-3 text-left">Scheduled Date</th>
                    <th className="px-4 py-3 text-left">Assigned Staff</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service: FuneralService & { registration_number?: string; assigned_staff_name?: string }) => (
                    <tr key={service.service_id} className="table-row">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        SVC-{String(service.service_id).padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/death-cases/${service.case_id}`}
                          className="text-[#2D6A4F] hover:underline font-medium"
                        >
                          {service.registration_number || `Case #${service.case_id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize">{service.service_type}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {service.scheduled_datetime
                          ? format(new Date(service.scheduled_datetime), 'MMM dd, yyyy HH:mm')
                          : 'Not scheduled'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {service.assigned_staff_name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={service.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {service.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setAssignModal({ open: true, serviceId: service.service_id })}
                                className="px-2 py-1 text-xs font-medium text-[#2D6A4F] border border-[#2D6A4F] rounded hover:bg-[#2D6A4F]/10"
                              >
                                Assign
                              </button>
                              <button
                                onClick={() => setRejectModal({ open: true, serviceId: service.service_id })}
                                className="px-2 py-1 text-xs font-medium text-red-600 border border-red-600 rounded hover:bg-red-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <Link
                            href={`/services/${service.service_id}`}
                            className="text-[#2D6A4F] hover:text-[#245c43]"
                          >
                            <ChevronRightIcon className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} services
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {assignModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Schedule & Assign Service</h2>
                <button onClick={() => setAssignModal({ open: false, serviceId: null })} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={assignForm.scheduled_datetime}
                    onChange={(e) => setAssignForm({ ...assignForm, scheduled_datetime: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Assign Staff *</label>
                  <select
                    value={assignForm.assigned_staff_id}
                    onChange={(e) => setAssignForm({ ...assignForm, assigned_staff_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staffList.map((staff) => (
                      <option key={staff.user_id} value={staff.user_id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAssignModal({ open: false, serviceId: null })}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!assignForm.scheduled_datetime || !assignForm.assigned_staff_id || isAssigning}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Reject Service Request</h2>
                <button onClick={() => setRejectModal({ open: false, serviceId: null })} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                Are you sure you want to reject this service request?
              </p>

              <div>
                <label className="label">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Provide a reason for rejection..."
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setRejectModal({ open: false, serviceId: null }); setRejectionReason(''); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason || isRejecting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
