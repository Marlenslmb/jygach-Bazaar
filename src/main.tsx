import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "./assets/visuals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// DEBUG — удалить после проверки
console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL ?? "MISSING");
console.log(
  "SUPABASE KEY:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "OK" : "MISSING",
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
