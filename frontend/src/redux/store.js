import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import reimbursementsReducer from './slices/reimbursementsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reimbursements: reimbursementsReducer,
  },
});

export default store;
