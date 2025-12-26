import { create } from 'zustand';
import api from '@/app/libs/api';

interface Complaint {
  id: number;
  complaintCode: string;
  title: string;
  description: string;
  complaintType: string;
  priority: string;
  status: string;
  complainantType: string;
  complainantId: number;
  accusedType: string;
  accusedId: number;
  orderId?: number;
  resolution?: string;
  actionTaken?: string;
  resolvedAt?: string;
  resolvedBy?: number;
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  complainant?: any;
  accused?: any;
  admin?: {
    id: number;
    name: string;
    email: string;
  };
  order?: {
    order_id: number;
    totalAmount: number;
  };
  attachments?: ComplaintAttachment[];
  notes?: ComplaintNote[];
  statusHistory?: ComplaintStatusHistory[];
}

interface ComplaintAttachment {
  id: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

interface ComplaintNote {
  id: number;
  adminId: number;
  note: string;
  isInternal: boolean;
  createdAt: string;
  admin?: {
    id: number;
    name: string;
  };
}

interface ComplaintStatusHistory {
  id: number;
  oldStatus?: string;
  newStatus: string;
  changedBy: number;
  note?: string;
  createdAt: string;
  admin?: {
    id: number;
    name: string;
  };
}

interface ComplaintStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  monthlyCount: number;
  avgResolutionTime: number;
  avgWaitTime: number;
  resolutionRate: number;
  byComplainantType: Record<string, number>;
  pendingCount: number;
  resolvedCount: number;
}

interface ComplaintAnalytics {
  type: string;
  data: any;
  total?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ComplaintStore {
  complaints: Complaint[];
  currentComplaint: Complaint | null;
  stats: ComplaintStats | null;
  analytics: ComplaintAnalytics | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: {
    page: number;
    limit: number;
    status: string;
    priority: string;
    type: string;
    complainantType: string;
    search: string;
    startDate: string;
    endDate: string;
  };

  // Fetch functions
  getAllComplaints: (filters?: Partial<ComplaintStore['filters']>) => Promise<void>;
  getComplaintById: (id: number) => Promise<Complaint>;
  getComplaintStats: () => Promise<void>;
  getComplaintAnalytics: (period?: string, type?: string) => Promise<void>;

  // Action functions
  createComplaint: (data: Partial<Complaint>) => Promise<Complaint>;
  updateComplaint: (id: number, data: Partial<Complaint>, note?: string) => Promise<Complaint>;
  resolveComplaint: (id: number, data: {
    resolution: string;
    actionTaken: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    status?: string;
  }) => Promise<Complaint>;
  addComplaintNote: (id: number, note: string, isInternal?: boolean) => Promise<void>;
  deleteComplaint: (id: number) => Promise<void>;
  exportComplaints: (format?: 'csv' | 'json') => Promise<void>;

  // Utility functions
  setFilters: (filters: Partial<ComplaintStore['filters']>) => void;
  clearFilters: () => void;
  setCurrentComplaint: (complaint: Complaint | null) => void;
}

export const useComplaintStore = create<ComplaintStore>((set, get) => ({
  complaints: [],
  currentComplaint: null,
  stats: null,
  analytics: null,
  loading: false,
  error: null,
  pagination: null,
  filters: {
    page: 1,
    limit: 10,
    status: 'all',
    priority: 'all',
    type: 'all',
    complainantType: 'all',
    search: '',
    startDate: '',
    endDate: '',
  },

  getAllComplaints: async (filters = {}) => {
    try {
      set({ loading: true, error: null });

      const currentFilters = { ...get().filters, ...filters };
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, String(value));
        }
      });

      const res = await api.get(`/api/complaints?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        complaints: res.data.complaints,
        pagination: res.data.pagination,
        loading: false 
      });
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to fetch complaints",
        loading: false 
      });
    }
  },

  getComplaintById: async (id: number) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get(`/api/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        currentComplaint: res.data.complaint,
        loading: false 
      });

      return res.data.complaint;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to fetch complaint details",
        loading: false 
      });
      throw err;
    }
  },

  getComplaintStats: async () => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get('/api/complaints/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        stats: res.data.stats,
        loading: false 
      });
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to fetch complaint statistics",
        loading: false 
      });
    }
  },

  getComplaintAnalytics: async (period = 'month', type = 'overview') => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get(`/api/complaints/analytics?period=${period}&type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        analytics: res.data.analytics,
        loading: false 
      });
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to fetch complaint analytics",
        loading: false 
      });
    }
  },

  createComplaint: async (data) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.post('/api/admincomplaint/createcomplaint', data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add to local state
      set((state) => ({
        complaints: [res.data.complaint, ...state.complaints],
        loading: false
      }));

      return res.data.complaint;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to create complaint",
        loading: false 
      });
      throw err;
    }
  },

  updateComplaint: async (id, data, note) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const updateData = note ? { ...data, note } : data;
      const res = await api.put(`/api/complaints/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update in local state
      set((state) => ({
        complaints: state.complaints.map(complaint =>
          complaint.id === id ? res.data.complaint : complaint
        ),
        currentComplaint: state.currentComplaint?.id === id 
          ? res.data.complaint 
          : state.currentComplaint,
        loading: false
      }));

      return res.data.complaint;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to update complaint",
        loading: false 
      });
      throw err;
    }
  },

  resolveComplaint: async (id, data) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.post(`/api/complaints/${id}/resolve`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update in local state
      set((state) => ({
        complaints: state.complaints.map(complaint =>
          complaint.id === id ? res.data.complaint : complaint
        ),
        currentComplaint: state.currentComplaint?.id === id 
          ? res.data.complaint 
          : state.currentComplaint,
        loading: false
      }));

      return res.data.complaint;
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to resolve complaint",
        loading: false 
      });
      throw err;
    }
  },

  addComplaintNote: async (id, note, isInternal = false) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.post(`/api/complaints/${id}/notes`, { note, isInternal }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update current complaint's notes
      set((state) => ({
        currentComplaint: state.currentComplaint?.id === id
          ? {
              ...state.currentComplaint,
              notes: [res.data.note, ...(state.currentComplaint.notes || [])]
            }
          : state.currentComplaint,
        loading: false
      }));
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to add note",
        loading: false 
      });
      throw err;
    }
  },

  deleteComplaint: async (id) => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      await api.delete(`/api/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove from local state
      set((state) => ({
        complaints: state.complaints.filter(complaint => complaint.id !== id),
        currentComplaint: state.currentComplaint?.id === id ? null : state.currentComplaint,
        loading: false
      }));
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to delete complaint",
        loading: false 
      });
      throw err;
    }
  },

  exportComplaints: async (format = 'csv') => {
    try {
      set({ loading: true, error: null });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token provided");
      }

      const res = await api.get(`/api/complaints/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        // Create download link for CSV
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'complaints.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      set({ loading: false });
    } catch (err: any) {
      set({ 
        error: err?.response?.data?.message || err?.message || "Failed to export complaints",
        loading: false 
      });
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        page: 1,
        limit: 10,
        status: 'all',
        priority: 'all',
        type: 'all',
        complainantType: 'all',
        search: '',
        startDate: '',
        endDate: '',
      }
    });
  },

  setCurrentComplaint: (complaint) => {
    set({ currentComplaint: complaint });
  },
}));