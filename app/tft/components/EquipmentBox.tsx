import React from 'react';
import {
  EquipmentType,
  EquipsByType,
  TFTEquip,
} from '@/api/tft/model/Equipment';
import Equipment from './Equipment';

interface Props {
  equipsByType: EquipsByType;
}

const EquipmentBox = ({ equipsByType }:Props) => {
  const generateEquipmentArray = (equipsByType: EquipsByType) => {
    if (!equipsByType) return [[]];
    const basic = equipsByType.get(EquipmentType['basic']) || [];
    const advanced = equipsByType.get(EquipmentType['advanced']) || [];
    const advancedMapByFormula = new Map<string, TFTEquip>();

    advanced.forEach((equip) => {
      advancedMapByFormula.set(equip.formula, equip);
    });

    const array: (TFTEquip | null)[][] = Array.from({ length: basic.length + 1 }, () => Array(basic.length + 1).fill(null));

    for (let i = 0; i <= basic.length; i++) {
      for (let j = 0; j <= basic.length; j++) {
        if (i === 0 && j === 0) continue;
        if (i === 0) {
          array[i][j] = basic[j - 1];
        } else if (j === 0) {
          array[i][j] = basic[i - 1];
        } else {
          const formula1 = `${basic[i - 1].equipId},${basic[j - 1].equipId}`;
          const formula2 = `${basic[j - 1].equipId},${basic[i - 1].equipId}`;
          array[i][j] = advancedMapByFormula.get(formula1) || advancedMapByFormula.get(formula2) || null;
        }
      }
    }

    return array;
  };

  const equipmentArray = generateEquipmentArray(equipsByType);

  return (
    <div className="inline-block">
      {equipmentArray.map((row, rowIndex) => (
        <div key={rowIndex}>
          {row.map((equip, colIndex) => (
            <div className="inline-block" key={colIndex}>
              <Equipment equip={equip} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default EquipmentBox;