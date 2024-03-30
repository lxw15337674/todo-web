import React from 'react';
import { TFTEquip } from '@/api/tft/model/Equipment';
import { Avatar, Popover } from 'antd';
import { Desc } from './Desc';

interface Props {
  equip: TFTEquip;
}

const Equipment: React.FC<Props> = ({ equip }) => {
  const renderCard = () => {
    return (
      <div>
        <div className="flex items-center">
          <Avatar shape="square" size={48} src={equip.imagePath} />
          <div className="ml-2 text-lg font-bold	">{equip.name}</div>
        </div>
        <Desc text={equip.effect} />
      </div>
    );
  };

  return (
    <Popover content={renderCard()} mouseLeaveDelay={0.5}>
      <Avatar
        shape="square"
        size={48}
        src={equip.imagePath}
        className="cursor-pointer"
      />
    </Popover>
  );
};

export default Equipment;
