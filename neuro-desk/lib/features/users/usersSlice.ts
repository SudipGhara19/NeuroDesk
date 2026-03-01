import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface UserRecord {
  _id: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
  isActive: boolean;
  isAiRestricted: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  address?: string;
  department?: string;
  bio?: string;
  stats?: {
    totalQueries?: number;
    docsUploaded?: number;
    totalTokensUsed?: number;
    errorRate?: number;
    totalCostEstimate?: number;
    lastActive?: string;
  };
  presence?: {
    isOnline?: boolean;
    lastSeen?: string;
  };
  analytics?: {
    popularSearchPatterns?: string[];
    sessionHistory?: {
      startTime?: string;
      endTime?: string;
      durationMs?: number;
    }[];
  };
}

interface UsersState {
  users: UserRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk<UserRecord[], void, { rejectValue: string }>(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<UserRecord[]>('/users');
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to fetch users');
    }
  }
);

export const updateUserStatus = createAsyncThunk<UserRecord, string, { rejectValue: string }>(
  'users/updateStatus',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.patch<{ message: string; user: UserRecord }>(`/users/${userId}/status`);
      return response.data.user;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(error?.response?.data?.message || 'Failed to update user status');
    }
  }
);

export const updateAiRestriction = createAsyncThunk<UserRecord, string, { rejectValue: string }>(
  'users/updateAiRestriction',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.patch<{ message: string; user: UserRecord }>(`/users/${userId}/restrict-ai`);
      return response.data.user;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(error?.response?.data?.message || 'Failed to update AI restriction');
    }
  }
);

export const createManager = createAsyncThunk<UserRecord, Record<string, string>, { rejectValue: string }>(
  'users/createManager',
  async (managerData, { rejectWithValue }) => {
    try {
      const response = await api.post<{ message: string; user: UserRecord; profile: Record<string, unknown> }>('/users/manager', managerData);
      return response.data.user;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(error?.response?.data?.message || 'Failed to create manager');
    }
  }
);

export const deleteUser = createAsyncThunk<string, string, { rejectValue: string }>(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete<{ message: string }>(`/users/${userId}`);
      return userId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(error?.response?.data?.message || 'Failed to delete user');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsers: (state) => {
      state.users = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'An unknown error occurred';
      })
      // Update Status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Update AI Restriction
      .addCase(updateAiRestriction.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
      })
      // Create Manager
      .addCase(createManager.fulfilled, (state, action) => {
        state.users.push(action.payload);
      });
  },
});

export const { clearUsers } = usersSlice.actions;
export default usersSlice.reducer;

// Selectors
export const selectAllUsers = (state: { users: UsersState }) => state.users.users;
export const selectUsersLoading = (state: { users: UsersState }) => state.users.loading;
export const selectUsersError = (state: { users: UsersState }) => state.users.error;
