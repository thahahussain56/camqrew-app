const fs = require('fs');
const path = require('path');

const files = [
  'src/components/cards/BookingCard.tsx',
  'src/components/cards/OrderCard.tsx',
  'src/components/cards/ProductCard.tsx',
  'src/components/forms/ListProductModal.tsx',
  'src/components/forms/LocationCascader.tsx',
  'src/components/ui/Input.tsx',
  'src/components/ui/TimePickerModal.tsx',
  'src/screens/admin/AdminDashboardScreen.tsx',
  'src/screens/auth/ForgotPasswordScreen.tsx',
  'src/screens/auth/OnboardingScreen.tsx',
  'src/screens/auth/ResetPasswordScreen.tsx',
  'src/screens/auth/SignUpScreen.tsx',
  'src/screens/customer/BookingScreen.tsx',
  'src/screens/customer/CartScreen.tsx',
  'src/screens/customer/CustomerProfileScreen.tsx',
  'src/screens/customer/HomeScreen.tsx',
  'src/screens/customer/MarketplaceScreen.tsx',
  'src/screens/customer/OrderDetailScreen.tsx',
  'src/screens/customer/ProductDetailScreen.tsx',
  'src/screens/customer/PublicProfileScreen.tsx',
  'src/screens/customer/RentalCheckoutScreen.tsx',
  'src/screens/customer/SaleCheckoutScreen.tsx',
  'src/screens/customer/ServicesScreen.tsx',
  'src/screens/professional/EarningsScreen.tsx',
  'src/screens/professional/ProfessionalDashboardScreen.tsx',
  'src/screens/professional/ProfessionalEditScreen.tsx',
  'src/screens/shared/ChatListScreen.tsx',
  'src/screens/shared/ContactScreen.tsx'
];

const regex = /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/;

files.forEach(f => {
  try {
    const c = fs.readFileSync(path.join(process.cwd(), f), 'utf8');
    c.split('\n').forEach((l, i) => {
      if (regex.test(l)) {
        console.log(f + ':' + (i + 1) + ': ' + l.trim());
      }
    });
  } catch(e) {}
});
