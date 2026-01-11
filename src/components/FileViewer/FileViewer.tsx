import Editor from '@monaco-editor/react';

interface FileViewerProps {
  content: string;
  language?: string;
  path?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    html: 'html',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    sh: 'shell',
    bash: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
  };
  return languageMap[ext || ''] || 'plaintext';
}

export function FileViewer({ content, language, path, onChange, readOnly = true }: FileViewerProps) {
  const detectedLanguage = language || (path ? getLanguageFromPath(path) : 'plaintext');

  return (
    <Editor
      height="100%"
      language={detectedLanguage}
      value={content}
      onChange={onChange}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
      }}
    />
  );
}
