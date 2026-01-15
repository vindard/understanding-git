export const fileIconColors: Record<string, string> = {
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

export const defaultFileColor = '#8a8a8a';

export function getFileColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return fileIconColors[ext] || defaultFileColor;
}
