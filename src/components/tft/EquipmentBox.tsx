import React, { useMemo } from 'react';
import {
  EquipmentType,
  EquipsByType,
  TFTEquip,
} from '@/api/tft/model/Equipment';
import Equipment from './Equipment';
import { Avatar } from 'antd';

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
      for (let j = 0; j <= basic.length; j++) {
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
    return array;
  }, [equipsByType]);
  return (
    <div className=" inline-block">
      {equipmentArray.map((row, index) => {
        return (
          <div key={index}>
            {row.map((equip, index) => {
              return (
                <div className=" inline-block p-1  " key={index}>
                  {equip ? (
                    <Equipment equip={equip} />
                  ) : (
                    <Avatar shape="square" size={48} />
                  )}
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
