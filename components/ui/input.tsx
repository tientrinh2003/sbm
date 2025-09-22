import * as React from 'react'; import { cn } from './utils';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>{}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("w-full border border-[--color-border] rounded-xl h-10 px-3", className)} {...props} />
));
Input.displayName = "Input";
