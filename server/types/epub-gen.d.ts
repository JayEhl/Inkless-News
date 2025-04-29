declare module 'epub-gen' {
  interface EpubOptions {
    title: string;
    author: string;
    publisher: string;
    content: Array<{
      title: string;
      data: string;
    }>;
    css?: string;
  }
  
  class EPub {
    constructor(options: EpubOptions, output: string);
    promise: Promise<void>;
  }
  
  export = EPub;
} 