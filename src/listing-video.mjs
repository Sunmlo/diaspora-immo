export const VIDEO_BUCKET = 'listing-videos';
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 120;
const formats = {'video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'};
export const VIDEO_ACCEPT = Object.keys(formats).join(',');
export function videoFileError(file) {
  if (!file || !formats[file.type] || !file.size) return 'Choisissez une vidéo MP4, MOV ou WebM.';
  if (file.size > MAX_VIDEO_BYTES) return 'La vidéo dépasse 50 Mo. Réduisez sa taille avant de l’ajouter.';
  return '';
}
export function videoDurationError(duration) {
  return !Number.isFinite(duration) || duration <= 0 ? 'Impossible de lire cette vidéo. Exportez-la en MP4 compatible puis réessayez.' : duration > MAX_VIDEO_SECONDS ? 'La vidéo doit durer 2 minutes maximum.' : '';
}
export function validVideoPath(path) {
  return typeof path === 'string' && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|mov|webm)$/.test(path);
}
export function listingVideoApi(base, key) {
  return {
    async upload(file, user, onProgress) {
      const error = videoFileError(file);
      if (error) throw Error(error);
      if (!user?.id || !user?.token) throw Error('Reconnectez-vous pour envoyer la vidéo.');
      const path = `${user.id}/${crypto.randomUUID()}.${formats[file.type]}`;
      await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `${base}/storage/v1/object/${VIDEO_BUCKET}/${path}`);
        request.timeout = 300000;
        request.setRequestHeader('apikey', key);
        request.setRequestHeader('Authorization', `Bearer ${user.token}`);
        request.setRequestHeader('Content-Type', file.type);
        request.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round(100 * e.loaded / e.total)); };
        request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(Error('La vidéo n’a pas pu être envoyée. Vérifiez votre connexion et votre session, puis réessayez.'));
        request.onerror = request.ontimeout = request.onabort = () => reject(Error('L’envoi de la vidéo a été interrompu. Votre formulaire est conservé ; réessayez.'));
        request.send(file);
      });
      return path;
    },
    async open(path, token) {
      if (!validVideoPath(path)) throw Error('Vidéo indisponible.');
      const response = await fetch(`${base}/storage/v1/object/sign/${VIDEO_BUCKET}/${path}`, {
        method:'POST', headers:{apikey:key,Authorization:`Bearer ${token || key}`,'Content-Type':'application/json'},
        body:JSON.stringify({expiresIn:300})
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.signedURL) throw Error('Vidéo indisponible. Réessayez ou consultez les photos du bien.');
      const url = new URL(data.signedURL, `${base}/storage/v1/`);
      if (url.origin !== new URL(base).origin) throw Error('Vidéo indisponible.');
      // Storage returns /object/sign/... relative to /storage/v1.
      return data.signedURL.startsWith('/object/') ? `${base}/storage/v1${data.signedURL}` : url.href;
    }
  };
}
