import React from 'react';
import { Desc } from './Desc';
import { TFTEquip } from '@/api/tft/model/Equipment';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface Props {
  equip: TFTEquip | null;
}

const Equipment = ({ equip }: Props) => {
  const renderCard = () => {
    if (!equip) {
      return null;
    }
    return (
      <div>
        <div className="flex items-center">
          <Avatar>
            <AvatarImage src={equip.imagePath} />
            <AvatarFallback>{equip.name}</AvatarFallback>
          </Avatar>
          <div className="ml-2 text-lg font-bold">{equip.name}</div>
        </div>
        <Desc text={equip.effect} />
      </div>
    );
  };

  return (
    <HoverCard>
      <HoverCardTrigger>
        <Avatar className='cursor-pointer m-1 rounded-none inline-block'>
          <AvatarImage src={equip?.imagePath} />
          <AvatarFallback>{equip?.name}</AvatarFallback>
        </Avatar>
      </HoverCardTrigger>
      <HoverCardContent>
        {
          !equip ? <div>Empty</div> :
            <div>
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src={equip.imagePath} />
                  <AvatarFallback>{equip.name}</AvatarFallback>
                </Avatar>
                <div className="ml-2 text-lg font-bold">{equip.name}</div>
              </div>
              <Desc text={equip.effect} />
            </div>
        }
      </HoverCardContent>
    </HoverCard>
  );
};

export default Equipment;
