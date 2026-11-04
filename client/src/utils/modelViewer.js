let loading = null;

export const loadModelViewer = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.customElements?.get('model-viewer')) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('model-viewer'));
    };
    document.head.appendChild(script);
  });
  return loading;
};
