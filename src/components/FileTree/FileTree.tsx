import { useState } from 'react';
import styles from './FileTree.module.css';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  path: string;
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect?: (path: string) => void;
  selectedPath?: string;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileSelect?: (path: string) => void;
  selectedPath?: string;
}

// SVG Icons
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
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

const FolderIcon = ({ expanded }: { expanded: boolean }) => (
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

const FileIcon = ({ name }: { name: string }) => {
  // Determine color based on file extension
  const ext = name.split('.').pop()?.toLowerCase() || '';
  let color = '#8a8a8a'; // default gray

  const colorMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: '#f7df1e',
    jsx: '#61dafb',
    ts: '#3178c6',
    tsx: '#3178c6',
    // Web
    html: '#e34c26',
    css: '#1572b6',
    json: '#cbcb41',
    // Markdown
    md: '#519aba',
    // Config
    yml: '#cb171e',
    yaml: '#cb171e',
    toml: '#9c4121',
    // Git
    gitignore: '#f14e32',
  };

  color = colorMap[ext] || color;

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
};

function FileTreeItem({ node, depth, onFileSelect, selectedPath }: FileTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (node.type === 'directory') {
      setExpanded(!expanded);
    } else {
      onFileSelect?.(node.path);
    }
  };

  const itemClasses = [
    styles.item,
    isSelected ? styles.itemSelected : ''
  ].filter(Boolean).join(' ');

  return (
    <div>
      <div
        onClick={handleClick}
        className={itemClasses}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.type === 'directory' ? (
          <ChevronIcon expanded={expanded} />
        ) : (
          <span className={styles.chevronSpacer} />
        )}
        {node.type === 'directory' ? (
          <FolderIcon expanded={expanded} />
        ) : (
          <FileIcon name={node.name} />
        )}
        <span className={styles.name}>{node.name}</span>
      </div>
      {node.type === 'directory' && expanded && node.children && (
        <div className={styles.children}>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, onFileSelect, selectedPath }: FileTreeProps) {
  return (
    <div className={styles.tree}>
      {files.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={0}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}
