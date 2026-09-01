import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router';
import Header from './Header';
import Footer from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { pathname } = useLocation();

  // Remonte en haut à chaque changement de page (hors ancres)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="vitrine flex flex-col min-h-screen">
      <Header />
      {/* key => l'animation d'entrée .page-in rejoue à chaque navigation */}
      <main key={pathname} className="page-in flex-1 pt-[66px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
