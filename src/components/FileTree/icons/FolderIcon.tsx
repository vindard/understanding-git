import styles from '../FileTree.module.css';

interface FolderIconProps {
  expanded: boolean;
}

export function FolderIcon({ expanded }: FolderIconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.icon}>
      {expanded ? (
        <path
          d="M1.5 3.5h4l1 1h7a1 1 0 011 1v7a1 1 0 01-1 1h-11a1 1 0 01-1-1v-8a1 1 0 011-1z"
          fill="#dcb67a"
          stroke="#dcb67a"
          strokeWidth="0.5"
        />
      ) : (
        <path
          d="M1.5 3.5h4l1 1h7a1 1 0 011 1v7a1 1 0 01-1 1h-11a1 1 0 01-1-1v-8a1 1 0 011-1z"
          fill="#9a8049"
          stroke="#9a8049"
          strokeWidth="0.5"
        />
      )}
    </svg>
  );
}
