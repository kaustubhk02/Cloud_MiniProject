import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/** MySQL rows use `id` and snake_case; UI expects `_id`, `userId`, `managerComments`, etc. */
function normalizeReimbursement(row) {
  if (!row) return row;
  const n = { ...row, id: row.id, _id: row.id };
  if (row.employee_name != null || row.employee_email != null) {
    n.userId = { name: row.employee_name, email: row.employee_email };
  }
  if (row.manager_comments != null) n.managerComments = row.manager_comments;
  if (row.reviewer_name != null) n.reviewedBy = { name: row.reviewer_name };
  if (row.reviewed_at != null) n.reviewedAt = row.reviewed_at;
  if (row.receipt_url != null) n.receiptUrl = row.receipt_url;
  if (row.receipt_key != null) n.receiptKey = row.receipt_key;
  if (row.assigned_manager_id != null) n.assignedManagerId = row.assigned_manager_id;
  if (row.assigned_manager_name != null) {
    n.assignedManager = {
      name: row.assigned_manager_name,
      email: row.assigned_manager_email,
    };
  }
  return n;
}

// Fetch all reimbursements (with optional query params)
export const fetchReimbursements = createAsyncThunk(
  'reimbursements/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/reimbursements', { params });
      return {
        ...res.data,
        data: Array.isArray(res.data.data) ? res.data.data.map(normalizeReimbursement) : res.data.data,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch');
    }
  }
);

// Fetch stats
export const fetchStats = createAsyncThunk('reimbursements/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/reimbursements/stats');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats');
  }
});

// Managers list (assign reviewer on submit)
export const fetchManagers = createAsyncThunk('reimbursements/fetchManagers', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/managers');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load managers');
  }
});

// Create reimbursement
export const createReimbursement = createAsyncThunk(
  'reimbursements/create',
  async (formData, { rejectWithValue }) => {
    try {
      // Do not set Content-Type — axios must add multipart boundary automatically.
      const res = await api.post('/reimbursements', formData);
      return { ...res.data, data: normalizeReimbursement(res.data.data) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create');
    }
  }
);

// Update reimbursement
export const updateReimbursement = createAsyncThunk(
  'reimbursements/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/reimbursements/${id}`, formData);
      return { ...res.data, data: normalizeReimbursement(res.data.data) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update');
    }
  }
);

// Employee removes receipt only (pending requests)
export const deleteReceiptAttachment = createAsyncThunk(
  'reimbursements/deleteReceipt',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/reimbursements/${id}/receipt`);
      return { ...res.data, data: normalizeReimbursement(res.data.data) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove attachment');
    }
  }
);

// Delete reimbursement
export const deleteReimbursement = createAsyncThunk(
  'reimbursements/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/reimbursements/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete');
    }
  }
);

// Approve reimbursement (backend: PUT /:id/review)
export const approveReimbursement = createAsyncThunk(
  'reimbursements/approve',
  async ({ id, managerComments }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/reimbursements/${id}/review`, {
        status: 'approved',
        manager_comments: managerComments || null,
      });
      return { ...res.data, data: normalizeReimbursement(res.data.data) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve');
    }
  }
);

// Reject reimbursement (backend: PUT /:id/review)
export const rejectReimbursement = createAsyncThunk(
  'reimbursements/reject',
  async ({ id, managerComments }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/reimbursements/${id}/review`, {
        status: 'rejected',
        manager_comments: managerComments || null,
      });
      return { ...res.data, data: normalizeReimbursement(res.data.data) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reject');
    }
  }
);

const reimbursementsSlice = createSlice({
  name: 'reimbursements',
  initialState: {
    items: [],
    pagination: null,
    stats: null,
    managers: [],
    managersLoading: false,
    loading: false,
    statsLoading: false,
    error: null,
    actionLoading: false,
  },
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchReimbursements.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchReimbursements.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReimbursements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Stats
    builder
      .addCase(fetchStats.pending, (state) => { state.statsLoading = true; })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.data;
      })
      .addCase(fetchStats.rejected, (state) => { state.statsLoading = false; });

    builder
      .addCase(fetchManagers.pending, (state) => { state.managersLoading = true; })
      .addCase(fetchManagers.fulfilled, (state, action) => {
        state.managersLoading = false;
        state.managers = action.payload;
      })
      .addCase(fetchManagers.rejected, (state) => { state.managersLoading = false; });

    // Create
    builder
      .addCase(createReimbursement.pending, (state) => { state.actionLoading = true; })
      .addCase(createReimbursement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload.data);
      })
      .addCase(createReimbursement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateReimbursement.pending, (state) => { state.actionLoading = true; })
      .addCase(updateReimbursement.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.data;
        const idx = state.items.findIndex((i) => String(i._id) === String(updated._id));
        if (idx !== -1) state.items[idx] = updated;
      })
      .addCase(updateReimbursement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Remove receipt only
    builder
      .addCase(deleteReceiptAttachment.pending, (state) => { state.actionLoading = true; })
      .addCase(deleteReceiptAttachment.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.data;
        const idx = state.items.findIndex((i) => String(i._id) === String(updated._id));
        if (idx !== -1) state.items[idx] = updated;
      })
      .addCase(deleteReceiptAttachment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteReimbursement.pending, (state) => { state.actionLoading = true; })
      .addCase(deleteReimbursement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((i) => i._id !== action.payload);
      })
      .addCase(deleteReimbursement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // Approve / Reject
    const handleManagerAction = (state, action) => {
      state.actionLoading = false;
      const updated = action.payload.data;
      const idx = state.items.findIndex((i) => String(i._id) === String(updated._id));
      if (idx !== -1) state.items[idx] = updated;
    };
    builder
      .addCase(approveReimbursement.pending, (state) => { state.actionLoading = true; })
      .addCase(approveReimbursement.fulfilled, handleManagerAction)
      .addCase(approveReimbursement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
    builder
      .addCase(rejectReimbursement.pending, (state) => { state.actionLoading = true; })
      .addCase(rejectReimbursement.fulfilled, handleManagerAction)
      .addCase(rejectReimbursement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = reimbursementsSlice.actions;
export default reimbursementsSlice.reducer;
