import React from 'react';
import { Avatar, Popover } from 'antd';
import { Desc } from './Desc';
import { TFTEquip } from '@/api/tft/model/Equipment';

interface Props {
  equip: TFTEquip | null;
}

const Equipment: React.FC<Props> = ({ equip }) => {
  const renderCard = () => {
    if (!equip) {
      return null;
    }
    return (
      <div>
        <div className="flex items-center">
          <Avatar shape="square" size={48} src={equip.imagePath} />
          <div className="ml-2 text-lg font-bold">{equip.name}</div>
        </div>
        <Desc text={equip.effect} />
      </div>
    );
  };

  return (
    <Popover content={renderCard()}>
      <Avatar
        shape="square"
        size={48}
        src={equip?.imagePath}
        className="cursor-pointer m-1"
      />
    </Popover>
  );
};

export default Equipment;
