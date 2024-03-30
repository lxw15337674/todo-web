export enum ChessImageType {
  /** 小头像 */
  head,
  /** 完整图片 */
  full,
}

export function getChessImage(
  idSeason: string,
  imageId: string,
  type: ChessImageType,
): string {
  switch (type) {
    case ChessImageType.head:
      return `https://game.gtimg.cn/images/lol/act/img/tft/champions/${imageId}.png`;
    case ChessImageType.full:
      return `https://game.gtimg.cn/images/lol/tftstore/${idSeason}/624x318/${imageId}.jpg`;
  }
}

export function getBorderColor(price: string) {
  switch (price) {
    case '1':
      return '#999999';
    case '2':
      return '#5FCC29';
    case '3':
      return '#297ACC';
    case '4':
      return '#CC29CC';
    case '5':
      return '#CCA329';
    default:
      return '#000000';
  }
}
