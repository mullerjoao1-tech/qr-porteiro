import { AppProvider } from "@/app/components/core/provider";
import { CoreShowcase } from "@/app/components/core/showcase";

export default function CoreShowcasePage() {
  return (
    <AppProvider segmento="beauty">
      <CoreShowcase />
    </AppProvider>
  );
}