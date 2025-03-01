import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const headingVariants = cva(
  "font-bold leading-tight tracking-tighter",
  {
    variants: {
      size: {
        default: "text-4xl md:text-5xl",
        lg: "text-5xl md:text-6xl",
        sm: "text-3xl md:text-4xl",
        xs: "text-2xl md:text-3xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface HeadingProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof headingVariants> {
  title: string;
  description?: string;
  descriptionClassName?: string;
}

export function Heading({
  title,
  description,
  className,
  descriptionClassName,
  size,
  ...props
}: HeadingProps) {
  return (
    <div className={className} {...props}>
      <h1 className={cn(headingVariants({ size }))}>{title}</h1>
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-2",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
} 