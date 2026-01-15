import styles from '../FileTree.module.css';
import { getFileColor } from './fileIconColors';

interface FileIconProps {
  name: string;
}

export function FileIcon({ name }: FileIconProps) {
  const color = getFileColor(name);

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.icon}>
      <path
        d="M3 1.5h6l4 4v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-12a1 1 0 011-1z"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1"
      />
      <path d="M9 1.5v4h4" stroke={color} strokeWidth="1" fill="none" />
    </svg>
  );
}
