import { TFTCard, TFTChess } from "@/api/tft/type";
import race from './race.json'
import job from './job.json'
import chess from './chess.json'
export type Item = TFTCard | TFTChess[] | null
// 将job和race合并，然后组合成一个二维数组用于表示羁绊组合，然后过滤掉不存在的羁绊组合
export const getFetter = (jobRaces: TFTCard[], chesses: TFTChess[]): Item[][] => {
    chesses = chess
    if (!jobRaces.length) return []
    let array: Item[][] = [];
    // 行
    for (let i = 0; i <= jobRaces.length; i++) {
        array[i] = new Array(jobRaces.length + 1);
        // 列
        for (let j = 0; j <= jobRaces.length; j++) {
            if (i === 0 && j === 0) {
                array[i][j] = null;
                continue;
            }
            if (i === 0) {
                array[i][j] = jobRaces[j - 1];
                continue;
            }
            if (j === 0) {
                array[i][j] = jobRaces[i - 1];
                continue;
            }
            const fetterx = jobRaces[i - 1].TFTID
            const fettery = jobRaces[j - 1].TFTID
            const matchedChesses = chesses.filter((chess) => {
                return chess.raceIds.includes(fetterx) && chess.jobIds.includes(fettery)
            })
            array[i][j] = matchedChesses.length > 0 ? matchedChesses : null
        }
    }
    console.log(array)
    // 过滤空行
    array = array.filter(row => {
        for (let i = 1; i < row.length; i++) {
            if (row[i]) {
                return true
            }
        }
        return false
    })
    // 不是空列
    const noValidIndex = array[0].reduce((pre, cur, index) => {
        if (!cur) return pre
        for (let i = 1; i < array.length; i++) {
            if (array[i][index]) {
                pre.push(index)
                break
            }
        }
        return pre
    }, [0] as number[])
    //只保留有效列
    return array.map(row => row.filter((_, index) => noValidIndex.includes(index)))
}

export const test = () => {
    console.log(getFetter([...race, ...job] as any, chess));

}