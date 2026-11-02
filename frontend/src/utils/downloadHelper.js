import axios from 'axios';

/**
 * Helper to download or save a file. 
 * If running in Tauri, it sends the file data to the backend to show a native Windows Save As dialog.
 * If running in a browser, it uses showSaveFilePicker if available or triggers a browser download.
 * 
 * @param {Blob|string} data - The Blob data or Base64 string of the file
 * @param {string} filename - The suggested filename
 * @param {boolean} isBase64 - Whether the data is already a Base64 string
 */
export async function saveOrOpenFile(data, filename, isBase64 = false) {
  const isTauri = typeof window !== 'undefined' && (
    !!window.__TAURI_INTERNALS__ || 
    !!window.__TAURI__ || 
    window.location?.hostname === 'tauri.localhost'
  );
  
  const apiBaseURL = axios.defaults.baseURL || '';
  const isLocalHost = !apiBaseURL || 
    apiBaseURL.includes('localhost') || 
    apiBaseURL.includes('127.0.0.1') || 
    apiBaseURL.includes('tauri.localhost');
  
  if (isLocalHost) {
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
      
      if (res.data?.cancelled) {
        return { success: false, cancelled: true };
      }
      if (res.data?.success) {
        return { success: true, path: res.data.path };
      }
    } catch (err) {
      console.error("Native save-and-open failed, falling back to browser dialog:", err);
    }
  }
  
  // Convert to Blob if base64
  let blob = data;
  if (isBase64) {
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    let mimeType = 'application/octet-stream';
    if (filename.endsWith('.png')) mimeType = 'image/png';
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (filename.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (filename.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    blob = new Blob([byteArray], { type: mimeType });
  }

  // Modern browser File System Access API (asks where to save)
  if (typeof window !== 'undefined' && window.showSaveFilePicker) {
    try {
      const types = [];
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        types.push({
          description: 'Excel Spreadsheet (*.xlsx)',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
        });
      } else if (filename.endsWith('.pdf')) {
        types.push({
          description: 'PDF Document (*.pdf)',
          accept: { 'application/pdf': ['.pdf'] }
        });
      } else if (filename.endsWith('.png')) {
        types.push({
          description: 'PNG Image (*.png)',
          accept: { 'image/png': ['.png'] }
        });
      }
      
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: types.length > 0 ? types : undefined
      });
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(blob);
      await writableStream.close();
      return { success: true };
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled save dialog
        return { success: false, cancelled: true };
      }
      console.warn("showSaveFilePicker failed or was blocked, falling back to download link:", err);
    }
  }
  
  // Standard browser fallback download link
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
