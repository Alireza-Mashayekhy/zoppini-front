export enum PaymentGateway {
  MELLAT = 'mellat',
  ZARINPAL = 'zarinpal',
  DIGIPAY = 'digipay',
  TARA = 'tara',
  /** اسنپ‌پی: فقط برای پرداخت سفارش (نه شارژ کیف پول) و فقط وقتی eligibility اسنپ‌پی آن را مجاز بداند نمایش داده می‌شود */
  SNAPPAY = 'snappay',
}
