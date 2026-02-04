import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Added this import
import App from './App';
import './index.css';

// Redux
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './redux/slices/authSlice';

// Create Store
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter> {/* Added this wrapper */}
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);