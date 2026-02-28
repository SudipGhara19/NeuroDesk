'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore } from '@/lib/store';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize store once using useState initializer
  const [storeData] = useState(() => makeStore());

  return (
    <Provider store={storeData.store}>
      <PersistGate loading={null} persistor={storeData.persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
