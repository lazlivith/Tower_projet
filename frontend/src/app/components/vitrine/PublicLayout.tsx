import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router';
import Header from './Header';
import Footer from './Footer';
import { useVitrineTheme } from '../../hooks/useVitrineTheme';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { pathname } = useLocation();
  const { theme, toggle } = useVitrineTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div data-theme={theme} className="vitrine flex flex-col min-h-screen">
      <Header theme={theme} onToggleTheme={toggle} />
      <main key={pathname} className="page-in flex-1 pt-[66px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
