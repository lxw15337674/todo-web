import axios from "axios";
import { service } from "..";
import { Chess, JobRaceType, JobType, RaceType, TFTCard } from "./type";
import { JobColor } from "@/components/tft/model/RaceJob";

export interface ISeasonInfo {
    booleanPreVersion: boolean;
    arrVersionLimit: string[];
    stringName: string;
    idSeason: string;
    urlChessData: string;
    urlRaceData: string;
    urlJobData: string;
    urlEquipData: string;
    urlBuffData: string;
    urlGalaxyData?: string;
    urlLegendData?: string;
    urlAdventureData?: string;
}



export function getVersionConfig(): Promise<ISeasonInfo[]> {
    return axios.get('/routing/tftVersionConfig').then(res => res.data)
}

// // 奇遇
// export function getAdventure(url): Promise<any> {
//     return axios.get()
// }


const routingGame = (url: string) => {
    return url.replace('https://game.gtimg.cn/', '/routing/game/')
}

// 棋子
export function getChessData(url: string) {
    return axios.get(routingGame(url)).then(res => {
        const data: Chess[] = res.data.data
       return data
    })
}


// 职业
export function getJobData(url: string): Promise<TFTCard[]> {
    return axios.get(routingGame(url)).then(res => {
        return res.data.data.map((job:JobType) => {
            return {
                ...job,
                level: job.job_color_list.split(",").map((item) => {
                    const [chessCount, color] = item.split(":");
                    return {
                        chessCount: parseInt(chessCount),
                        color: parseInt(color),
                        description: job.level[parseInt(chessCount)],
                    };
                })
            }
        })
    })
}

// 羁绊
export function getRaceData(url: string): Promise<TFTCard[]> {
    return axios.get(routingGame(url)).then(res => {
        return res.data.data.map((race: JobType) => {
            return {
                ...race,
                level: race.job_color_list.split(",").map((item) => {
                    const [chessCount, color] = item.split(":");
                    return {
                        chessCount: parseInt(chessCount),
                        color: parseInt(color),
                        description: race.level[parseInt(chessCount)],
                    };
                })
            }
        })
    })
}
