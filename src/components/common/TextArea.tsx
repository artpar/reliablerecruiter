import React, { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = true,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium1 mb-1"
          >
            {label}
          </label>
        )}
        <div>
          <textarea
            ref={ref}
            className={`
              block w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white 
              ${error ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500' : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'} 
              focus:outline-none focus:ring-2 focus:ring-opacity-50
              disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed
              resize-y
              ${className}
            `}
            {...props}
          />
        </div>
        {helperText && !error && (
          <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
