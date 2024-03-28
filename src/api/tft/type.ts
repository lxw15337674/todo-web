import { JobColor } from "@/components/tft/model/RaceJob";

// 英雄基础数据类型
export interface Chess {
    // 攻击数据
    attack: {
        // 攻击范围
        range: string;
        // 攻击速度
        speed: string;
        // 攻击力
        value: string;
    };
    // 暴击率
    critRate: string;
    // 英雄ID
    id: string;
    // 英雄图片ID
    imageId: string;
    // 英雄职业
    jobs: {
        // 职业ID
        id: string;
        // 职业名称
        name: string;
    }[];
    // 英雄生命值数据
    life: {
        // 护甲
        armor: string;
        // 魔抗
        spellBlock: string;
        // 生命值
        value: string;
    };
    // 英雄名称
    name: string;
    // 英雄价格
    price: number;
    // 英雄种族
    races: {
        // 种族ID
        id: string;
        // 种族名称
        name: string;
    }[];
    // 英雄技能数据
    skill: {
        // 技能详情
        detail: string;
        // 技能图标URL
        iconUrl: string;
        // 技能法力消耗
        magic: string;
        // 技能名称
        name: string;
        // 技能初始法力消耗
        startMagic: string;
    };
}


// 羁绊类型
export interface RaceType {
    // Unique identifier for the race
    raceId: string;

    // The name of the race
    name: string;

    // Identifier for a specific trait associated with the race
    traitId: string;

    // A brief introduction or description of the race
    introduce: string;

    // Alias or alternative names for the race
    alias: string;

    // Object mapping different levels to their descriptions
    level: {
        [level: string]: string;
    };

    // Identifier associated with Teamfight Tactics (TFT), if applicable
    TFTID: string;

    // Identifier for the character associated with this race
    characterid: string;

    // Unique identifier for the race instance
    id: string;

    // Path to an image representing the race
    imagePath: string;

    // A string representing a list of colors associated with the race
    race_color_list: string;
}
export interface JobType {
    TFTID: string;
    alias: string;
    characterid: string;
    id: string;
    imagePath: string;
    introduce: string;
    jobId: string;
    job_color_list: string;
    level: {
        [level: number]: string;
    };
    name: string;
    traitId: string;
}


export interface Level {
    /** 所需棋子数量 */
    chessCount: number
    /** 效果描述 */
    description: string
    /** 等级对应的颜色 */
    color: JobColor
}
export interface TFTCard {
    TFTID: string;
    alias: string;
    characterid: string;
    id: string;
    imagePath: string;
    introduce: string;
    jobId: string;
    job_color_list: string;
    level: Level[];
    name: string;
    traitId: string;
}