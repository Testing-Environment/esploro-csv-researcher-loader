export interface AssetFileLink {
  title: string;
  url: string;
  description?: string;
  type: string;  // AssetFileAndLinkTypes ID required by the Esploro API
  supplemental: boolean;
}