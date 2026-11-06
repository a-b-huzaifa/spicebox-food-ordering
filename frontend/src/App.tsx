import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ThemeProvider } from './context/ThemeContext';
import About from './pages/About';
import ComingSoon from './pages/ComingSoon';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import StyleGuide from './pages/StyleGuide';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="styleguide" element={<StyleGuide />} />

            {/* Placeholders: each one names the stage that builds it. */}
            <Route path="restaurants" element={<ComingSoon title="Restaurants" stage={17} description="Search, filter and browse every restaurant." />} />
            <Route path="restaurants/:id" element={<ComingSoon title="Restaurant menu" stage={17} description="Menu, dish details and add to cart." />} />
            <Route path="cart" element={<ComingSoon title="Your cart" stage={18} description="Review items and adjust quantities." />} />
            <Route path="checkout" element={<ComingSoon title="Checkout" stage={19} description="Address, payment method and order summary." />} />
            <Route path="orders" element={<ComingSoon title="My orders" stage={20} description="Order history with live status tracking." />} />
            <Route path="orders/:id" element={<ComingSoon title="Order details" stage={20} description="Status timeline, receipt and reviews." />} />
            <Route path="login" element={<ComingSoon title="Log in" stage={16} description="Sign in to your account." />} />
            <Route path="register" element={<ComingSoon title="Create account" stage={16} description="Sign up as a customer or restaurant owner." />} />
            <Route path="profile" element={<ComingSoon title="Your profile" stage={16} description="Manage your details and saved addresses." />} />
            <Route path="owner" element={<ComingSoon title="Owner dashboard" stage={21} description="Manage your restaurant, menu and incoming orders." />} />
            <Route path="admin" element={<ComingSoon title="Admin dashboard" stage={22} description="Users, approvals, orders and platform stats." />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
