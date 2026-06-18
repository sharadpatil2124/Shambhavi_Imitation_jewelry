import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token');
const savedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const initialState = {
  isAuthenticated: !!token,
  user: savedUser,
  token: token || null,
  error: null,
  loading: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUser: (state, action) => {
      state.isAuthenticated = true;
      state.user = {
        _id: action.payload._id,
        name: action.payload.name,
        email: action.payload.email,
        role: action.payload.role,
        isAdmin: action.payload.isAdmin,
        phone: action.payload.phone || ""
      };
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    logoutUser: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateProfile: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  }
});

export const { loginUser, logoutUser, updateProfile } = authSlice.actions;
export default authSlice.reducer;
