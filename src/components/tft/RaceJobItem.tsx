import React, { useState } from 'react';
import {
  getRaceJobLevelBorderColor,
  getRaceJobLevelColor,
} from './model/RaceJob';
import { Popover } from 'antd';
import { TFTCard } from '@/api/tft/type';

interface Props {
  raceJob: TFTCard;
}

const RaceJobItem: React.FC<Props> = ({ raceJob }) => {
  const [openPopover, setOpenPopover] = useState(false);
  if (!raceJob) {
    return null;
  }

  const renderRaceJobDetail = (raceJob: TFTCard) => {
    return (
      <div className="flex flex-col p-4 ">
        <span className="text-base text-gray-900">{raceJob.introduce}</span>
        {raceJob.level?.map((level, index) => {
          return (
            <div className={` flex-center`} key={index}>
              <div
                className={`flex w-5 h-5 m-1 justify-center`}
                style={{
                  backgroundColor: getRaceJobLevelColor(level.color),
                  borderColor: getRaceJobLevelBorderColor(level.color),
                }}
              >
                <span className="text-xs font-bold text-white text-center">
                  {level.chessCount}
                </span>
              </div>
              <span className="flex-1 text-sm leading-5 text-gray-600">
                {level.description}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <Popover
      content={renderRaceJobDetail(raceJob)}
      overlayInnerStyle={{ padding: 0 }}
      open={openPopover}
      trigger={'hover'}
      onOpenChange={(visible) => {
        setOpenPopover(window.screen.availWidth > 500 && visible);
      }}
    >
      <div className={`flex flex-col   m-0.5 items-center justify-center`}>
        <div className="flex items-center">
          <img
            className="white-icon"
            src={raceJob.imagePath}
            style={{ width: 16, height: 16 }}
          />
          <span className="text-base font-bold text-white ml-1">
            {raceJob.name}
          </span>
        </div>

        {raceJob.level.length > 1 && (
          <span className="text-xs text-gray-400">
            {raceJob.level.map((e) => e.chessCount).join('/')}
          </span>
        )}
      </div>
    </Popover>
  );
};

export default RaceJobItem;
