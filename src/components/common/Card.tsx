import React, {ReactNode} from 'react';

interface CardProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    footer?: ReactNode;
    header?: ReactNode;
    className?: string;
    noPadding?: boolean;
    hoverable?: boolean;
    border?: boolean;
}

const Card: React.FC<CardProps> = ({
                                       children,
                                       title,
                                       subtitle,
                                       footer,
                                       header,
                                       className = '',
                                       noPadding = false,
                                       hoverable = false,
                                       border = true,
                                   }) => {
    return (<div
            className={`
        rounded-lg shadow-md 
        ${border ? 'border border-neutral-200' : ''} 
        ${hoverable ? 'transition-shadow hover:shadow-lg' : ''}
        ${className}
      `}
        >
            {header && <div className="px-6 py-4 border-b border-neutral-200 bg-background">{header}</div>}

            {(title || subtitle) && (<div
                    className={`${noPadding ? '' : 'px-6 py-4'} ${!header && border ? 'border-b border-neutral-200' : ''}`}>
                    {title && <h3 className="text-xl font-bold ">{title}</h3>}
                    {subtitle && <p className="mt-1 text-sm ">{subtitle}</p>}
                </div>)}

            <div className={noPadding ? '' : 'px-6 py-4'}>{children}</div>

            {footer && (
                <div className={`${noPadding ? '' : 'px-6 py-4'} ${border ? 'border-t border-neutral-200' : ''}`}>
                    {footer}
                </div>)}
        </div>);
};

export default Card;
