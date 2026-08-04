import { HTMLAttributes, ReactNode } from "react";

interface CardProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`
        bg-white
        dark:bg-slate-900
        rounded-xl
        border
        border-slate-200
        dark:border-slate-700
        shadow-sm
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}