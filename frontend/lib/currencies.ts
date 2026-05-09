// Định dạng số thành chuỗi tiền tệ dựa trên mã tiền tệ cung cấp.
export const formatCurrency = (amount: number, currencyCode: string = 'VND'): string => {
  const code = currencyCode.toUpperCase();

  try {
    // Với VND, giữ nguyên định dạng truyền thống (ví dụ: 500.000 ₫)
    if (code === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(amount);
    }

    // Với các loại tiền tệ khác, hiển thị theo dạng: 20 AUD, 15.5 USD...
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${formattedAmount} ${code}`;
  } catch (e) {
    return `${amount.toLocaleString()} ${code}`;
  }
};
