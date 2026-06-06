import React from "react";

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode;
}

export const List = ({ children, className = "", ...props }: ListProps) => {
  return (
    <ul className={`space-y-3 md:space-y-4 w-full ${className}`} {...props}>
      {children}
    </ul>
  );
};

export interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
  bulletClassName?: string;
}

export const ListItem = ({ children, className = "", bulletClassName = "", ...props }: ListItemProps) => {
  return (
    <li className={`flex items-start gap-3 md:gap-4 text-[var(--text-main)] font-medium ${className}`} {...props}>
      <span className={`h-2 w-2 md:h-2.5 md:w-2.5 shrink-0 rounded-full bg-[var(--text-main)] mt-2 ${bulletClassName}`} />
      <span className="leading-relaxed text-base md:text-lg w-full">{children}</span>
    </li>
  );
};
