/**
 * ===== ЕДИНАЯ ТОЧКА ВХОДА В API =====
 * Supabase — реальные данные из БД
 */

import {
  supabaseMastersApi,
  supabaseMaterialsApi,
  supabaseOrdersApi,
  supabaseMessagesApi,
  supabaseBidsApi,
} from './supabase'

export const mastersApi   = supabaseMastersApi
export const materialsApi = supabaseMaterialsApi
export const ordersApi    = supabaseOrdersApi
export const messagesApi  = supabaseMessagesApi
export const bidsApi      = supabaseBidsApi
