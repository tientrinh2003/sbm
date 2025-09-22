import * as React from 'react'; import { cn } from '@/lib/utils';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{ variant?:'default'|'outline'|'ghost', size?:'sm'|'md'|'lg' }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant='default', size='md', type='button', children, ...props }, ref)=>{
  const base='inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-[--color-ring]';
  const v=variant==='outline'?'border border-[--color-border] bg-white hover:bg-slate-50':variant==='ghost'?'bg-transparent hover:bg-slate-100':'bg-[--color-primary] text-[--color-primary-foreground] hover:opacity-90';
  const s=size==='sm'?'h-8 px-3 text-sm':size==='lg'?'h-12 px-6 text-base':'h-10 px-4 text-sm';
  return <button ref={ref} type={type} className={cn(base,v,s,className)} {...props}>{children}</button>;
}); Button.displayName='Button'; export default Button;
