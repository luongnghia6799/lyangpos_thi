import axios from 'axios';

/**
 * Helper to download or save a file. 
 * If running in Tauri, it sends the file data to the backend to save and open natively.
 * If running in a browser, it triggers a normal browser download.
 * 
 * @param {Blob|string} data - The Blob data or Base64 string of the file
 * @param {string} filename - The suggested filename
 * @param {boolean} isBase64 - Whether the data is already a Base64 string
 */
export async function saveOrOpenFile(data, filename, isBase64 = false) {
  const isTauri = !!window.__TAURI_INTERNALS__;
  const apiBaseURL = axios.defaults.baseURL || '';
  const isLocalHost = apiBaseURL.includes('localhost') || apiBaseURL.includes('127.0.0.1') || apiBaseURL.includes('tauri.localhost');
  
  if (isTauri && isLocalHost) {
    try {
      let base64_data = '';
      if (isBase64) {
        base64_data = data;
      } else {
        // Convert Blob to Base64
        base64_data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(data);
        });
      }
      
      const res = await axios.post('/api/tauri/save-and-open', {
        filename,
        base64_data
      });
      
      if (res.data.success) {
        return { success: true, path: res.data.path };
      }
    } catch (err) {
      console.error("Tauri save-and-open failed, falling back to browser download:", err);
    }
  }
  
  // Standard browser fallback
  let blob = data;
  if (isBase64) {
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return { success: true };
}
