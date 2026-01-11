import { useState } from 'react';

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

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          padding: '4px 8px',
          paddingLeft: `${depth * 16 + 8}px`,
          cursor: 'pointer',
          backgroundColor: isSelected ? '#37373d' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {node.type === 'directory' && (
          <span style={{ fontSize: '10px' }}>{expanded ? '▼' : '▶'}</span>
        )}
        <span>{node.type === 'directory' ? '📁' : '📄'}</span>
        <span>{node.name}</span>
      </div>
      {node.type === 'directory' && expanded && node.children && (
        <div>
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
    <div style={{ fontSize: '14px', fontFamily: 'system-ui' }}>
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
