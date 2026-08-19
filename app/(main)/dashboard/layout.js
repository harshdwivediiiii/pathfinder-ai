import { Suspense } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import DashboardFooter from "./_components/footer";

export default function Layout({ children }) {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
      <DashboardFooter />
    </>
  );
}
