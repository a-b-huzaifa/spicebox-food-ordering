import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ThemeProvider } from './context/ThemeContext';
import About from './pages/About';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import StyleGuide from './pages/StyleGuide';

function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="styleguide" element={<StyleGuide />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

test('home page renders hero, featured restaurants and payment picker', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/delivered/i);
  expect(screen.getByText('Burger Forge')).toBeInTheDocument();
  expect(screen.getByRole('radiogroup', { name: /payment method/i })).toBeInTheDocument();
});

test('about page renders', () => {
  renderAt('/about');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/good food/i);
});

test('style guide renders every payment method', () => {
  renderAt('/styleguide');
  expect(screen.getAllByRole('radio')).toHaveLength(4);
});

test('unknown route shows the 404 page', () => {
  renderAt('/definitely-not-a-page');
  expect(screen.getByText('404')).toBeInTheDocument();
});
