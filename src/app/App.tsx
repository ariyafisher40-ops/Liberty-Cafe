import { AuthProvider } from '../features/auth/AuthContext';
import { CartProvider } from '../features/cart/CartContext';
import { SettingsProvider } from '../features/settings/SettingsContext';
import { AppRouter } from './router';

export function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
