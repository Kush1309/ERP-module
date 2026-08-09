const variantStyles = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 focus-visible:ring-brand-500 disabled:text-ink-400',
};

function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed';

  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Button;
