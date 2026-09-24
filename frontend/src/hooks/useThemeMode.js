import { useSelector } from 'react-redux';

export function useThemeMode() {
  return useSelector((state) => state.theme.mode);
}
