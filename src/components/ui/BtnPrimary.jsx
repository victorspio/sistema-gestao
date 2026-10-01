/**
 * BtnPrimary — Botão primário que segue a cor dinâmica da empresa.
 * Usa var(--brand-primary) via CSS, então responde automaticamente
 * a qualquer alteração feita em Configurações → Cores & Identidade Visual.
 */
export default function BtnPrimary({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  size = 'md',
  variant = 'solid',
  ...rest
}) {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all shadow-sm ' +
    'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ' +
    (sizeClasses[size] ?? sizeClasses.md);

  const handleMouseEnter = (e) => { if (!disabled) e.currentTarget.style.opacity = '0.85'; };
  const handleMouseLeave = (e) => { e.currentTarget.style.opacity = '1'; };
  const handleMouseDown  = (e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; };
  const handleMouseUp    = (e) => { e.currentTarget.style.transform = 'scale(1)'; };

  if (variant === 'soft') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${className}`}
        style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary, #00c8ff) 12%, transparent)', color: 'var(--brand-primary, #00c8ff)' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${className}`}
      style={{ backgroundColor: 'var(--brand-primary, #00c8ff)', color: '#ffffff' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...rest}
    >
      {children}
    </button>
  );
}
