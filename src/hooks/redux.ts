import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

/**
 * Hook dispatch có type đầy đủ — dùng thay cho useDispatch() gốc
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Hook selector có type đầy đủ — dùng thay cho useSelector() gốc
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
