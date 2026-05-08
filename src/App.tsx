import { Routes, Route } from 'react-router-dom'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { Toast } from '@/components/ui/Toast'
import { ScrollToTop } from '@/components/shared/ScrollToTop'
import { HomePage } from '@/pages/HomePage'
import { MaterialsPage } from '@/pages/MaterialsPage'
import { MaterialDetailPage } from '@/pages/MaterialDetailPage'
import { MastersPage } from '@/pages/MastersPage'
import { MasterDetailPage } from '@/pages/MasterDetailPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { NewOrderPage } from '@/pages/NewOrderPage'
import { ConstructorPage } from '@/pages/ConstructorPage'
import { MessagesPage } from '@/pages/MessagesPage'
import { AuthPage } from '@/pages/AuthPage'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Авторизация — без Header/Footer */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Все остальные страницы */}
        <Route path="*" element={
          <>
            <Header />
            <main className="max-w-[1400px] mx-auto px-5 md:px-8 py-8 relative z-[2]">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/materials/:id" element={<MaterialDetailPage />} />
                <Route path="/masters" element={<MastersPage />} />
                <Route path="/masters/:id" element={<MasterDetailPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/new" element={<NewOrderPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:id" element={<MessagesPage />} />
                <Route path="/constructor" element={<ConstructorPage />} />
              </Routes>
            </main>
            <Footer />
            <Toast />
          </>
        } />
      </Routes>
    </>
  )
}
