export const hexToRgb = (hex: string) =>
  /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(hex)?.slice(1, 4).map(a => parseInt(a, 16)).join(',');

export const numComma = (num: number = 0) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const formatDate = (date: string | Date) => new Date(date).toLocaleDateString();

export const formatTime = (date: string | Date) => new Date(date).toLocaleTimeString().replace(/...$/,'');

export const formatRemainingTime = (createdAt: string): string => {
  const now = new Date();
  const createdDate = new Date(createdAt);
  const deadline = new Date(createdDate.getTime() + 60 * 60 * 1000); // 1시간 후
  const remainingTime = deadline.getTime() - now.getTime();
  const absRemainingTime = Math.abs(remainingTime);

  const days = Math.floor(absRemainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absRemainingTime / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((absRemainingTime / (1000 * 60)) % 60);

  let message = '';

  days === 0 ? (
    hours === 0 ? (
      minutes === 0 ? message = '마감' : message = `${minutes}분`
    ) : message = `${hours}시간 ${minutes}분`
  ) : message = `${days}일 ${hours}시간 ${minutes}분`;

  if (remainingTime < 0) {
    message += ' 초과';
  } else {
    message += ' 남음';
  }
  return message;
};
