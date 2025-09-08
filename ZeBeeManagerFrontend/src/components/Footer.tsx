import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full py-6 mt-12 border-t border-border/40">
            <div className="container mx-auto flex justify-center items-center">
                <p className="text-sm text-muted-foreground">
                &copy; {currentYear} Azazuu central (Powered by ZeBee.AIR) | Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
