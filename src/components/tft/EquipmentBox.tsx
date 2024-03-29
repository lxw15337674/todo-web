import React, { useMemo } from 'react';
import {
  EquipmentType,
  EquipsByType,
  TFTEquip,
} from '@/api/tft/model/Equipment';

interface Props {
  equipsByType: EquipsByType;
}

const EquipmentBox: React.FC<Props> = ({ equipsByType }) => {
  const equipmentArray = useMemo(() => {
    if (!equipsByType) return [[]];
    const basic = equipsByType.get(EquipmentType['basic']) || [];
    const advanced = equipsByType.get(EquipmentType['advanced']) || [];
    const advancedMapByFormula = advanced.reduce(
      (pre, cur) => {
        pre.set(cur.formula, cur);
        return pre;
      },
      new Map([]) as Map<string, TFTEquip>,
    );
    const array: (TFTEquip | null)[][] = new Array(basic.length + 1);
    // 第一个单元格为空，第一行和第一列都为基础装备,其他为进阶装备
    for (let i = 0; i <= basic.length; i++) {
      array[i] = new Array(basic.length + 1);
      // 列
      for (let j = 0; j < basic.length; j++) {
        if (i === 0 && j === 0) {
          array[i][j] = null;
          continue;
        }
        if (i === 0) {
          array[i][j] = basic[j - 1];
          continue;
        }
        if (j === 0) {
          array[i][j] = basic[i - 1];
          continue;
        }
        let advancedEquip = advancedMapByFormula.get(
          `${basic[i - 1].equipId},${basic[j - 1].equipId}`,
        );
        if (!advancedEquip) {
          advancedEquip = advancedMapByFormula.get(
            `${basic[j - 1].equipId},${basic[i - 1].equipId}`,
          );
        }
        array[i][j] = advancedEquip!;
      }
    }
    console.log(array);
    return array;
  }, [equipsByType]);
  // const renderChessCard = (chess: TFTChess) => {
  //     return null
  //     const imageWidth = 500;
  //     const raceJobs: TFTCard[] = [];
  //     for (const id of chess.raceIds.split(',')) {
  //         const race = races.find((race) => race.id === id);
  //         if (race) {
  //             raceJobs.push(race);
  //         }
  //     }

  //     for (const id of chess.jobIds.split(',')) {
  //         const job = jobs.find((job) => job.id === id);
  //         if (job) {
  //             raceJobs.push(job);
  //         }
  //     }
  //     return (
  //         <div
  //             className={`flex overflow-hidden height-[${imageWidth / 2}px]`}
  //         >
  //             <div
  //                 style={{
  //                     position: 'relative',
  //                     width: imageWidth,
  //                 }}
  //             >
  //                 <Image
  //                     src={getChessImage(
  //                         version.idSeason,
  //                         chess.TFTID,
  //                         ChessImageType.full,
  //                     )}
  //                     preview={false}
  //                     width={imageWidth}
  //                     height={'100%'}
  //                 />
  //                 <div
  //                     style={{
  //                         position: 'absolute',
  //                         left: 20,
  //                         bottom: 16,
  //                         display: 'flex',
  //                         flexDirection: 'column',
  //                     }}
  //                 >
  //                     {raceJobs.map((raceJob) => {
  //                         return (
  //                             <div
  //                                 style={{
  //                                     display: 'flex',
  //                                     flexDirection: 'row',
  //                                     alignItems: 'center',
  //                                     marginTop: 4,
  //                                 }}
  //                                 key={raceJob.id}
  //                             >
  //                                 <img
  //                                     className={'white-icon'}
  //                                     src={raceJob.imagePath}
  //                                     style={{ width: 16, height: 16, marginRight: 4 }}
  //                                 />
  //                                 <span style={{ fontSize: 15, color: 'white' }}>
  //                                     {raceJob.name}
  //                                 </span>
  //                             </div>
  //                         );
  //                     })}
  //                     <span
  //                         style={{
  //                             fontSize: 20,
  //                             fontWeight: 'bold',
  //                             color: 'white',
  //                             marginTop: 8,
  //                         }}
  //                     >
  //                         {chess.title} {chess.displayName}
  //                     </span>
  //                 </div>
  //             </div>
  //             <div className="w-[40rem] p-2">
  //                 <Descriptions
  //                     column={3}
  //                     bordered
  //                     size={'small'}
  //                     labelStyle={{
  //                         fontSize: 13,
  //                         fontWeight: 'bold',
  //                         color: '#9e9e9e',
  //                         textAlign: 'center',
  //                         padding: 0
  //                     }}
  //                     contentStyle={{ fontSize: 13, color: '#212121', padding: '4px 0 4px 8px', minWidth: '4rem', fontWeight: 'bold' }}
  //                     items={[
  //                         { label: '生命', children: chess.lifeData },
  //                         { label: '护甲', children: chess.armor },
  //                         { label: '魔抗', children: chess.spellBlock },
  //                         { label: '攻击', children: chess.attackData },
  //                         { label: '攻速', children: chess.attackSpeed },
  //                         { label: '暴击', children: chess.crit },
  //                         { label: '攻击距离', children: chess.attackRange },
  //                         { label: '初始法力值', children: chess.startMagic || '0' },
  //                         { label: '最大法力值', children: chess.magic || '0' },
  //                     ]}
  //                 />
  //                 <div
  //                     className='flex items-center my-2 '
  //                 >
  //                     <img
  //                         src={chess.originalImage}
  //                         style={{ width: 24, height: 24, marginRight: 8 }}
  //                     />

  //                     <span
  //                         className='text-lg'
  //                         style={{ fontWeight: 'bold', color: '#212121' }}
  //                     >
  //                         {chess.skillName}
  //                     </span>
  //                 </div>
  //                 <span style={{ fontSize: 13, color: '#212121' }}>
  //                     {chess.skillDetail}
  //                 </span>
  //             </div>
  //         </div>
  //     );
  // };

  return (
    <div>
      {equipmentArray.map((row, index) => {
        return (
          <div key={index}>
            {row.map((equip, index) => {
              return (
                <div
                  className="border inline-block"
                  key={index}
                  style={{ width: '10rem', height: '10rem' }}
                >
                  {equip?.name ?? '占位'}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default EquipmentBox;
