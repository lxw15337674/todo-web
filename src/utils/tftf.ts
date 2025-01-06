import { TFTCard, TFTChess } from '@/api/tft/type';
// import race from './race.json'
// import job from './job.json'
// import chess from './chess.json'
export type Item = TFTCard | TFTChess[] | null;
// 将job和race合并，然后组合成一个二维数组用于表示羁绊组合，然后过滤掉不存在的羁绊组合
export const getFetter = (
  jobs: TFTCard[],
  races: TFTCard[],
  chesses: TFTChess[],
): Item[][] => {
  if (!chesses.length || !jobs.length || !races.length) return [[]];
  // 处理没有职业的情况，就拿第一个羁绊作为职业合入jobs里，这样才能显示,例如异画师 彗
  chesses.forEach((chess) => {
    if (!chess.jobIds) {
      const job = chess.raceIds.split(',')[0];
      jobs = [...jobs, races.find((race) => race.TFTID === job)!];
    }
  });
  let array: Item[][] = [];
  // 行
  for (let i = 0; i <= races.length; i++) {
    array[i] = new Array(races.length + 1);
    // 列
    for (let j = 0; j <= jobs.length; j++) {
      if (i === 0 && j === 0) {
        array[i][j] = null;
        continue;
      }
      if (i === 0) {
        array[i][j] = jobs[j - 1];
        continue;
      }
      if (j === 0) {
        array[i][j] = races[i - 1];
        continue;
      }
      const job = array[0][j] as TFTCard;
      const race = array[i][0] as TFTCard;
      if (job === race) {
        array[i][j] = [];
        continue;
      }
      array[i][j] = chesses.filter((chess) => {
        const ids = chess.raceIds.split(',').concat(chess.jobIds.split(','));
        return ids.includes(race?.TFTID) && ids.includes(job?.TFTID);
      });
    }
  }
  // 过滤空行
  array = array.filter((row) => {
    for (let i = 1; i < row.length; i++) {
      if (row[i]) {
        return true;
      }
    }
    return false;
  });
  // 不是空列，例如召唤兽
  const noValidIndex = array[0].reduce(
    (pre, cur, index) => {
      if (!cur) return pre;
      if ((cur as TFTCard).level.length <= 1) {
        return pre;
      }
      for (let i = 1; i < array.length; i++) {
        if ((array[i][index] as TFTChess[]).length > 0) {
          pre.push(index);
          break;
        }
      }
      return pre;
    },
    [0] as number[],
  );
  // 只保留有效列
  return array.map((row) =>
    row.filter((_, index) => noValidIndex.includes(index)),
  );
};
