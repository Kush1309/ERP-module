import { useRef, useState, useEffect } from 'react';

export default function TiltCard({ children, className = '', maxRotation = 5 }) {
    const ref = useRef(null);
    const [style, setStyle] = useState({});
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const listener = (e) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, []);

    const handleMouseMove = (e) => {
        if (!ref.current || prefersReducedMotion) return;

        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Normalize to -1 to 1 based on center of card
        const normX = Math.min(Math.max((x / rect.width) * 2 - 1, -1), 1);
        const normY = Math.min(Math.max((y / rect.height) * 2 - 1, -1), 1);

        setStyle({
            transform: `perspective(1000px) rotateX(${normY * -maxRotation}deg) rotateY(${normX * maxRotation}deg) scale3d(1.02, 1.02, 1.02)`
        });
    };

    const handleMouseLeave = () => {
        if (prefersReducedMotion) return;
        setStyle({
            transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
        });
    };

    return (
        <div
            ref={ref}
            className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
            style={{ ...style, transformStyle: 'preserve-3d' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
}
