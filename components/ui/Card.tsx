import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Card({ children, className = "", id }: CardProps) {
  return (
    <div
      id={id}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function CardHeader({ children, className = "", action }: CardHeaderProps) {
  return (
    <div
      className={`px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 flex items-center justify-between ${className}`}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <h3 className={`text-base sm:text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className = "" }: CardDescriptionProps) {
  return <p className={`text-sm text-gray-500 mt-0.5 ${className}`}>{children}</p>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}
