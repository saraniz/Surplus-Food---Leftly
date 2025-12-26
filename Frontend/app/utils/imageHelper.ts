export const getImageUrl = (image: any): string => {
  if (!image) return "/placeholder-image.jpg";
  if (typeof image === 'string') return image;
  return image?.imageBase64 || image?.imageUrl || "/placeholder-image.jpg";
};