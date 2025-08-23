declare module "react-icons/fi" {
  import * as React from "react";
  export interface IconBaseProps extends React.SVGAttributes<SVGElement> {
    size?: string | number;
    color?: string;
    title?: string;
  }
  export const FiTrash2: React.FC<IconBaseProps>;
}
