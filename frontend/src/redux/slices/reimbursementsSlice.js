import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch all reimbursements (with optional query params)
export const fetchReimbursements = createAsyncThunk(
  'reimbursements/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/reimbursements', { params });
      return res.data;
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

// Create reimbursement
export const createReimbursement = createAsyncThunk(
  'reimbursements/create',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/reimbursements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
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
      const res = await api.put(`/reimbursements/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update');
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

// Approve reimbursement
export const approveReimbursement = createAsyncThunk(
  'reimbursements/approve',
  async ({ id, managerComments }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/reimbursements/${id}/approve`, { managerComments });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve');
    }
  }
);

// Reject reimbursement
export const rejectReimbursement = createAsyncThunk(
  'reimbursements/reject',
  async ({ id, managerComments }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/reimbursements/${id}/reject`, { managerComments });
      return res.data;
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
        const idx = state.items.findIndex((i) => i._id === action.payload.data._id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      })
      .addCase(updateReimbursement.rejected, (state, action) => {
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
      const idx = state.items.findIndex((i) => i._id === action.payload.data._id);
      if (idx !== -1) state.items[idx] = action.payload.data;
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
