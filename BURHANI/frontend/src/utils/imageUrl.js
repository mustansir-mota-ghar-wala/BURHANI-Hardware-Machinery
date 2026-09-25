/**
 * Utility to deliver transparent product cutouts.
 * Injects Cloudinary AI background removal transformation into URLs.
 */
export function getCleanProductImage(url) {
  if (!url) return '';
  if (
    typeof url === 'string' &&
    url.includes('res.cloudinary.com') &&
    url.includes('/image/upload/') &&
    !url.includes('/e_background_removal/')
  ) {
    return url.replace('/image/upload/', '/image/upload/e_background_removal/');
  }
  return url;
}
