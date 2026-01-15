import styles from '../FileTree.module.css';

interface ChevronIconProps {
  expanded: boolean;
}

export function ChevronIcon({ expanded }: ChevronIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={styles.chevron}
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      <path d="M6 4l4 4-4 4V4z" />
    </svg>
  );
}
