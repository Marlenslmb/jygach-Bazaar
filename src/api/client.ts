/**
 * ===== ЕДИНАЯ ТОЧКА ВХОДА В API =====
 *
 * Сейчас — моки. Потом, когда подключим Supabase, делаем так:
 *
 * 1. Создаём src/api/supabase/client.ts с тем же интерфейсом.
 * 2. Здесь меняем строку:
 *      import { mockXxxApi } from './mock/client'
 *    на:
 *      import { supabaseXxxApi } from './supabase/client'
 *
 * UI ни одной строки менять не придётся, потому что вся работа
 * происходит через эти экспортируемые объекты.
 *
 * Можно также управлять через переменную окружения:
 *   const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
 *   export const materialsApi = useSupabase ? supabaseMaterialsApi : mockMaterialsApi
 */

import {
  mockMaterialsApi,
  mockMastersApi,
  mockOrdersApi,
  mockMessagesApi,
} from './mock/client'

export const materialsApi = mockMaterialsApi
export const mastersApi = mockMastersApi
export const ordersApi = mockOrdersApi
export const messagesApi = mockMessagesApi
