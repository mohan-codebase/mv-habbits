import React, { useId, forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, required, className = '', style, type = 'text', id, ...props }, ref) => {
    const uid = useId();
    const inputId = id || `input-${uid}`;
    const errorId = `input-error-${uid}`;

    const [focused, setFocused] = React.useState(false);

    const borderColor = error
      ? 'var(--danger)'
      : focused
        ? 'var(--border-active)'
        : 'var(--border-subtle)';

    const boxShadow = error
      ? focused
        ? '0 0 0 3px color-mix(in srgb, var(--accent-primary) 15%, transparent)'
        : 'none'
      : focused
        ? '0 0 0 3px var(--accent-glow)'
        : 'none';

    return (
      <div className={`flex flex-col gap-1.5 ${className}`} style={style}>
        {label && (
          <label htmlFor={inputId} className="select-none text-[13px] font-medium text-text-secondary">
            {label}
            {required && (
              <span className="ml-[3px] text-[var(--danger)]" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span
              className="absolute left-3 z-[1] flex items-center pointer-events-none transition-colors duration-150"
              style={{ color: focused ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            >
              {icon}
            </span>
          )}

          <input
            {...props}
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full rounded-full bg-bg-tertiary text-[14px] text-text-primary outline-none transition-[transform,filter,background,opacity,border-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${icon ? 'py-2.5 pr-3.5 pl-10' : 'px-3.5 py-2.5'}`}
            style={{
              border: `1px solid ${borderColor}`,
              boxShadow,
            }}
          />
        </div>

        {error && (
          <p id={errorId} role="alert" className="m-0 flex items-center gap-1 text-[12px] text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
