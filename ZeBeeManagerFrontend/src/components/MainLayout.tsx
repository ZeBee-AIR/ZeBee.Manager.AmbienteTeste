import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Navigation />
                <main className="flex-grow">
                    <div className="w-100 bg-red-600 text-yellow-50">Você está no ambiente de testes.</div>
                    <Outlet />
                </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
