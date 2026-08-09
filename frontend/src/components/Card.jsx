function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-ink-200/90 bg-white/90 p-5 shadow-[0_1px_2px_rgba(31,38,46,0.04)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
