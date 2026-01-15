import { useState } from 'react';
import styles from './FileTree.module.css';
import { ChevronIcon, FolderIcon, FileIcon } from './icons';

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
