import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { MobileNav } from "@/components/shared/MobileNav";
import { Toast } from "@/components/ui/Toast";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { HomePage } from "@/pages/HomePage";
import { MaterialsPage } from "@/pages/MaterialsPage";
import { MaterialDetailPage } from "@/pages/MaterialDetailPage";
import { MastersPage } from "@/pages/MastersPage";
import { MasterDetailPage } from "@/pages/MasterDetailPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { NewOrderPage } from "@/pages/NewOrderPage";
import { ConstructorPage } from "@/pages/ConstructorPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { AuthPage } from "@/pages/AuthPage";
import { ProfilePage } from "@/pages/ProfilePage";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="*"
          element={
            <>
              <Header />
              <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8 relative z-[2] pb-24 md:pb-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/materials" element={<MaterialsPage />} />
                  <Route
                    path="/materials/:id"
                    element={<MaterialDetailPage />}
                  />
                  <Route path="/masters" element={<MastersPage />} />
                  <Route path="/masters/:id" element={<MasterDetailPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/new" element={<NewOrderPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/messages/:id" element={<MessagesPage />} />
                  <Route path="/constructor" element={<ConstructorPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Routes>
              </main>
              <Footer />
              <MobileNav />
              <Toast />
            </>
          }
        />
      </Routes>
    </>
  );
}
