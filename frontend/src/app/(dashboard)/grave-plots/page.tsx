'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { Grave, Cemetery, Section } from '@/types';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  Squares2X2Icon,
  MapIcon,
} from '@heroicons/react/24/outline';

export default function GravePlotsPage() {
  const [plots, setPlots] = useState<Grave[]>([]);
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [filters, setFilters] = useState({
    cemetery_id: '',
    section_id: '',
    plot_type: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchCemeteries();
  }, []);

  useEffect(() => {
    fetchPlots();
  }, [pagination.page, filters]);

  useEffect(() => {
    if (filters.cemetery_id) {
      fetchSections(filters.cemetery_id);
    } else {
      setSections([]);
    }
  }, [filters.cemetery_id]);

  const fetchCemeteries = async () => {
    try {
      const res = await api.get('/cemeteries');
      setCemeteries(res.data.cemeteries || []);
    } catch (error) {
      console.error('Failed to fetch cemeteries:', error);
    }
  };

  const fetchSections = async (cemeteryId: string) => {
    try {
      const res = await api.get(`/cemeteries/${cemeteryId}/sections`);
      setSections(res.data.sections || []);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const fetchPlots = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filters.cemetery_id) params.append('cemetery_id', filters.cemetery_id);
      if (filters.section_id) params.append('section_id', filters.section_id);
      if (filters.plot_type) params.append('plot_type', filters.plot_type);

      const res = await api.get(`/graves?${params}`);
      setPlots(res.data.plots || []);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch plots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchPlots();
  };

  return (
    <div>
      <Header title="Available Plots" />

      <div className="p-6 lg:p-8">
        {/* Filter Bar */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Cemetery</label>
              <select
                value={filters.cemetery_id}
                onChange={(e) =>
                  setFilters({ ...filters, cemetery_id: e.target.value, section_id: '' })
                }
                className="input-field"
              >
                <option value="">All Cemeteries</option>
                {cemeteries.map((c) => (
                  <option key={c.cemetery_id} value={c.cemetery_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label">Section</label>
              <select
                value={filters.section_id}
                onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
                className="input-field"
                disabled={!filters.cemetery_id}
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s.section_id} value={s.section_id}>
                    {s.section_name} ({s.section_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label">Plot Type</label>
              <select
                value={filters.plot_type}
                onChange={(e) => setFilters({ ...filters, plot_type: e.target.value })}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="standard">Standard</option>
                <option value="family">Family</option>
                <option value="estate">Estate</option>
                <option value="cremation">Cremation</option>
              </select>
            </div>
            <button onClick={handleSearch} className="btn-primary">
              <MagnifyingGlassIcon className="w-4 h-4" />
              Search Plots
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          {pagination.total > 0 ? (
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              results
            </p>
          ) : (
            <p className="text-sm text-gray-500">No results found</p>
          )}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        {viewMode === 'map' ? (
          <div className="card h-96 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm">Map view coming soon</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : plots.length === 0 ? (
          <EmptyState
            title="No plots found"
            description="Try adjusting your filters to find available plots."
            icon={MapPinIcon}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plots.map((plot) => (
              <div key={plot.grave_id} className="card relative group">
                <div className="h-32 rounded-lg mb-3 relative overflow-hidden">
                  {(plot as any).image_url ? (
                    <img
                      src={(plot as any).image_url}
                      alt={plot.plot_id}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2D6A4F] to-[#1B3A2D] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{plot.plot_id}</span>
                    </div>
                  )}
                  <StatusBadge
                    status={plot.status}
                    className="absolute top-2 right-2"
                  />
                </div>

                <h4 className="font-bold text-gray-900">{plot.plot_id}</h4>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>
                    {plot.cemetery_name} • {plot.section_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                  <span className="capitalize">{plot.plot_type}</span>
                  <span>Capacity: {plot.capacity}</span>
                </div>

                <Link
                  href={`/grave-plots/${plot.grave_id}`}
                  className="btn-secondary w-full mt-3 text-sm"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPagination((p) => ({ ...p, page: i + 1 }))}
                className={`px-3 py-1 rounded-lg text-sm ${
                  pagination.page === i + 1
                    ? 'bg-[#2D6A4F] text-white'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Family Plot Requests */}
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2">Need Multiple Plots?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Request family plots or adjacent plots for your loved ones.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/grave-plots/request-family" className="btn-primary">
              Request Family Plot
            </Link>
            <Link href="/grave-plots/request-adjacent" className="btn-secondary">
              Request Adjacent Plot
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
