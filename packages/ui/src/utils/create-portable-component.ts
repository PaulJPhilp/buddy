import * as React from "react";

export type PortableRef<T> = React.ForwardedRef<T>;

export function createPortableComponent<T, P extends object>(
  render: (props: P & { ref?: PortableRef<T> }) => React.ReactElement | null
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>> {
  return React.forwardRef<T, P>((props, ref) => render({ ...props, ref } as any));
}
