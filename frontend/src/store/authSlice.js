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
      const addr = action.payload.addresses && action.payload.addresses[0] ? action.payload.addresses[0] : {};
      state.user = {
        _id: action.payload._id,
        name: action.payload.name,
        email: action.payload.email,
        role: action.payload.role,
        phone: action.payload.phone || "",
        addresses: action.payload.addresses || [],
        address: addr.street || "",
        city: addr.city || "",
        state: addr.state || "",
        zipCode: addr.pincode || ""
      };
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    registerUser: (state, action) => {
      state.isAuthenticated = true;
      const addr = action.payload.addresses && action.payload.addresses[0] ? action.payload.addresses[0] : {};
      state.user = {
        _id: action.payload._id,
        name: action.payload.name,
        email: action.payload.email,
        role: action.payload.role,
        phone: action.payload.phone || "",
        addresses: action.payload.addresses || [],
        address: addr.street || "",
        city: addr.city || "",
        state: addr.state || "",
        zipCode: addr.pincode || ""
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
        const addr = action.payload.addresses && action.payload.addresses[0] ? action.payload.addresses[0] : null;
        state.user = {
          ...state.user,
          ...action.payload,
          ...(addr ? {
            address: addr.street || "",
            city: addr.city || "",
            state: addr.state || "",
            zipCode: addr.pincode || ""
          } : {})
        };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    addOrder: (state, action) => {
      if (state.user) {
        const newOrder = {
          id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
          date: new Date().toISOString().split('T')[0],
          status: "Processing",
          total: action.payload.total,
          paymentMethod: action.payload.paymentMethod,
          trackingId: `SF${Math.floor(100000000 + Math.random() * 900000000)}IN`,
          items: action.payload.items
        };
        if (!state.user.orders) state.user.orders = [];
        state.user.orders.unshift(newOrder);
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  }
});

export const { loginUser, registerUser, logoutUser, updateProfile, addOrder } = authSlice.actions;
export default authSlice.reducer;
