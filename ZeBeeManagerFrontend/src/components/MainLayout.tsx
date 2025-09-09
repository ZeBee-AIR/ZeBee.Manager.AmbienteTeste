import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';

const MainLayout = () => {
    return (
        // CORREÇÃO: trocando 'bg-black' por 'bg-background' para usar a cor do tema
        <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
            {/* Movimento de fundo com partículas */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Partículas flutuantes de fundo */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,245,255,0.03)_0%,transparent_50%" style={{animation: 'floatSmoothX 80s ease-in-out infinite'}}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,229,255,0.025)_0%,transparent_60%" style={{animation: 'floatSmoothY 90s ease-in-out infinite reverse'}}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.02)_0%,transparent_70%" style={{animation: 'floatSmoothZ 100s ease-in-out infinite'}}></div>
            </div>
            
            {/* 5 Bolas de glow estrategicamente posicionadas */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Bola 1 - Canto superior esquerdo */}
                <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] bg-secondary/25 rounded-full filter blur-[120px]" style={{animation: 'smoothRandomFloat1 45s ease-in-out infinite'}}></div>
                
                {/* Bola 2 - Canto superior direito */}
                <div className="absolute top-[8%] right-[3%] w-[350px] h-[350px] bg-[#00E5FF]/20 rounded-full filter blur-[100px]" style={{animation: 'smoothRandomFloat2 38s ease-in-out infinite'}}></div>
                
                {/* Bola 3 - Centro da tela */}
                <div className="absolute top-[45%] left-[45%] w-[500px] h-[300px] bg-[#00D4FF]/18 rounded-full filter blur-[140px]" style={{animation: 'smoothRandomFloat3 52s ease-in-out infinite'}}></div>
                
                {/* Bola 4 - Canto inferior esquerdo */}
                <div className="absolute bottom-[5%] left-[8%] w-[450px] h-[350px] bg-secondary/22 rounded-full filter blur-[130px]" style={{animation: 'smoothRandomFloat4 41s ease-in-out infinite'}}></div>
                
                {/* Bola 5 - Canto inferior direito */}
                <div className="absolute bottom-[10%] right-[5%] w-[380px] h-[380px] bg-[#00E5FF]/16 rounded-full filter blur-[110px]" style={{animation: 'smoothRandomFloat5 47s ease-in-out infinite'}}></div>
                
                {/* Feixes de luz verticais sutis */}
                <div className="absolute left-[25%] w-[1px] h-[100vh] bg-gradient-to-t from-transparent via-secondary/6 to-transparent opacity-25" style={{animation: 'lightBeamRise 70s linear infinite'}}></div>
                <div className="absolute left-[75%] w-[1px] h-[100vh] bg-gradient-to-t from-transparent via-[#00E5FF]/5 to-transparent opacity-20" style={{animation: 'lightBeamRise2 80s linear infinite', animationDelay: '30s'}}></div>
                
                {/* Movimento adicional no centro */}
                 <div className="absolute top-[60%] left-[20%] w-[300px] h-[200px] bg-[#00D4FF]/12 rounded-full filter blur-[90px]" style={{animation: 'smoothRandomFloat1 58s ease-in-out infinite reverse'}}></div>
                 <div className="absolute top-[25%] right-[30%] w-[250px] h-[250px] bg-secondary/10 rounded-full filter blur-[80px]" style={{animation: 'smoothRandomFloat2 63s ease-in-out infinite'}}></div>
                 
                 {/* Bolas adicionais nos cantos inferiores */}
                 <div className="absolute bottom-[2%] left-[2%] w-[320px] h-[320px] bg-[#00E5FF]/18 rounded-full filter blur-[100px]" style={{animation: 'smoothRandomFloat3 39s ease-in-out infinite'}}></div>
                 <div className="absolute bottom-[3%] right-[1%] w-[280px] h-[280px] bg-secondary/15 rounded-full filter blur-[85px]" style={{animation: 'smoothRandomFloat4 44s ease-in-out infinite reverse'}}></div>
            </div>
            
            {/* Textura animada para profundidade */}
            <div className="fixed inset-0 pointer-events-none opacity-6 z-0">
                <div className="w-full h-full bg-[radial-gradient(circle,rgba(0,245,255,0.015)_1px,transparent_1px bg-[length:60px_60px]" style={{animation: 'gentleFloat 50s ease-in-out infinite'}}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(0,245,255,0.03)_0%,transparent_80%" style={{animation: 'softBackgroundPulse 75s ease-in-out infinite'}}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,229,255,0.025)_0%,transparent_85%" style={{animation: 'softBackgroundPulse 85s ease-in-out infinite reverse'}}></div>
            </div>
            
            <div className="relative z-10 flex flex-col min-h-screen">
                <Navigation />
                <main className="flex-grow pt-20">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default MainLayout;
