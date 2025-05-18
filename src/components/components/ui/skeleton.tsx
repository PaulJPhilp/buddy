import { cn } from "../../../../packages/ui/src/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  children?: React.ReactNode;
}

function Skeleton({
  className,
  isLoading = true,
  children,
  ...props
}: SkeletonProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn("rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
export type { SkeletonProps };
