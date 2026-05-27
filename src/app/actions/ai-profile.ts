'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  AiProfileType,
  ProfileItem,
  DEFAULT_RUNNING_PROFILE,
  DEFAULT_GYM_PROFILE,
} from './ai-profile-defaults'

export type GetAiProfileResult = {
  items: ProfileItem[];
  isFallback: boolean;
  error?: string;
};

export async function getAiProfile(
  type: AiProfileType
): Promise<GetAiProfileResult> {
  try {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return {
        items: [],
        isFallback: true,
        error: 'AUTH_ERROR',
      };
    }

    const userId = userData.user.id;
    const defaults = type === 'running' ? DEFAULT_RUNNING_PROFILE : DEFAULT_GYM_PROFILE;

    // 1. Try to upsert default items (self-seeding on conflict user_id, profile_type, item_id)
    const { error: upsertError } = await supabase
      .from('ai_profiles')
      .upsert(
        defaults.map((item) => ({
          user_id: userId,
          profile_type: type,
          item_id: item.item_id,
          item_label: item.item_label,
          item_value: item.item_value,
          item_order: item.item_order,
        })),
        {
          onConflict: 'user_id,profile_type,item_id',
          ignoreDuplicates: true,
        }
      );

    if (upsertError) {
      if (upsertError.code === '42P01') {
        return {
          items: [],
          isFallback: true,
          error: 'TABLE_NOT_FOUND',
        };
      }
      throw upsertError;
    }

    // 2. Fetch current items
    const { data, error } = await supabase
      .from('ai_profiles')
      .select('item_id, item_label, item_value, item_order')
      .eq('user_id', userId)
      .eq('profile_type', type)
      .order('item_order', { ascending: true });

    if (error) {
      return {
        items: [],
        isFallback: true,
        error: error.message,
      };
    }

    return {
      items: data ?? [],
      isFallback: false,
    };
  } catch (error: any) {
    console.error('getAiProfile Server Action Error:', error);
    return {
      items: [],
      isFallback: true,
      error: error.message || 'UNKNOWN_ERROR',
    };
  }
}

export async function saveAiProfile(
  type: AiProfileType,
  items: ProfileItem[]
): Promise<{ ok: boolean; isFallback: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return {
        ok: false,
        isFallback: true,
        error: 'AUTH_ERROR',
      };
    }

    const userId = userData.user.id;

    const normalizedItems = items
      .filter((item) => item.item_label.trim() && item.item_value.trim())
      .map((item, index) => ({
        user_id: userId,
        profile_type: type,
        item_id: item.item_id,
        item_label: item.item_label.trim(),
        item_value: item.item_value.trim(),
        item_order: index + 1,
      }));

    // 1. Delete existing items for this type
    const { error: deleteError } = await supabase
      .from('ai_profiles')
      .delete()
      .eq('user_id', userId)
      .eq('profile_type', type);

    if (deleteError) {
      if (deleteError.code === '42P01') {
        return {
          ok: false,
          isFallback: true,
          error: 'TABLE_NOT_FOUND',
        };
      }
      return {
        ok: false,
        isFallback: true,
        error: deleteError.message,
      };
    }

    // 2. Insert new list
    if (normalizedItems.length > 0) {
      const { error: insertError } = await supabase
        .from('ai_profiles')
        .insert(normalizedItems);

      if (insertError) {
        return {
          ok: false,
          isFallback: true,
          error: insertError.message,
        };
      }
    }

    revalidatePath('/running')
    revalidatePath('/gym')

    return {
      ok: true,
      isFallback: false,
    };
  } catch (error: any) {
    console.error('saveAiProfile Server Action Error:', error);
    return {
      ok: false,
      isFallback: true,
      error: error.message || 'UNKNOWN_ERROR',
    };
  }
}
