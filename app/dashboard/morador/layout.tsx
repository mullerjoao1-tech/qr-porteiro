import type {
  ReactNode,
} from "react";

import ReceptorChamadasMorador from "@/app/components/core/morador/ReceptorChamadasMorador";

export default function LayoutMorador({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <>
      <ReceptorChamadasMorador />

      {children}
    </>
  );
}
