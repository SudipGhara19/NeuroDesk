import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  bio?: string;
  phone?: string;
  address?: string;
  stats?: Record<string, number>;
  userData?: {
    department?: string;
    bio?: string;
    phone?: string;
    address?: string;
    profilePicture?: string;
    stats?: {
      totalQueries?: number;
      totalTokensUsed?: number;
      avgLatencyMs?: number;
      errorRate?: number;
      totalCostEstimate?: number;
    };
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  profileLoading: boolean;
  profileError: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  profileLoading: false,
  profileError: null,
};

export const fetchProfile = createAsyncThunk<{ user: { fullName?: string; department?: string; bio?: string; address?: string; phone?: string; stats?: Record<string, number>; [key: string]: unknown } }, void, { rejectValue: string }>(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/users/profile');
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk<{ message: string; user: User; profile: Record<string, unknown> }, { fullName?: string; department?: string; bio?: string; phone?: string; address?: string }, { rejectValue: string }>(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/users/profile', profileData);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(error?.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      dispatch(authSlice.actions.logout());
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        // The profile endpoint returns a UserData doc (different _id, no role).
        // We must preserve the core identity fields from the original login token.
        const profileData = action.payload.user;
        state.user = {
          ...state.user,
          // Merge only safe profile fields — never overwrite _id, email, or role
          fullName: profileData.fullName || state.user?.fullName,
          department: profileData.department,
          bio: profileData.bio,
          phone: profileData.phone,
          address: profileData.address,
          stats: profileData.stats,
          userData: profileData,
        } as User;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload || 'Failed to fetch profile';
      })
      .addCase(updateProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        if (state.user) {
          state.user.fullName = action.payload.user.fullName;
          state.user.userData = action.payload.profile;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload || 'Failed to update profile';
      });
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectProfileLoading = (state: { auth: AuthState }) => state.auth.profileLoading;
export const selectProfileError = (state: { auth: AuthState }) => state.auth.profileError;
