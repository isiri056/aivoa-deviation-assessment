import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import DeviationPage from './pages/DeviationPage';

export default function App() {
  return (
    <Provider store={store}>
      <DeviationPage />
    </Provider>
  );
}
