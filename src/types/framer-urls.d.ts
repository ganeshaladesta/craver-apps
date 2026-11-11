declare module "https://framer.com/m/*" {
  import type { ComponentType } from "react";
  const Component: ComponentType<Record<string, any>>;
  export default Component;
}

