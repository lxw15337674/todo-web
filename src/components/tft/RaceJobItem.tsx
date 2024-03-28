import React, { useMemo, useState } from 'react';
import { JobColor, getRaceJobLevelBorderColor, getRaceJobLevelColor } from './model/RaceJob';
import { Popover } from 'antd';
import { JobType } from '@/api/tft/type';



interface Props {
  raceJob: JobType;
}

const RaceJobItem: React.FC<Props> = ({ raceJob }) => {
  const [openPopover, setOpenPopover] = useState(false);
  if (!raceJob) {
    return null
  }
  const levels = useMemo(() => {
    return raceJob.job_color_list.split(",").map((item) => {
      const [chessCount, color] = item.split(":");
      return {
        chessCount: parseInt(chessCount),
        color: parseInt(color),
        description: raceJob.level[parseInt(chessCount)],
      };
    });
  }, [raceJob.level])

  const renderRaceJobDetail = (raceJob: JobType) => {
    return (
      <div className="flex flex-col p-4">
        <span className="text-base text-gray-900">{raceJob.introduce}</span>
        {levels?.map((level, index) => {
          return (
            <div className={`flex items-start mt-${index === 0 ? 3 : 2}`}
              key={index}
            >
              <div className={`flex w-5 h-5 mr-1 bg-${getRaceJobLevelColor(level.color)} border-${getRaceJobLevelBorderColor(level.color)} border-solid border-0.5 justify-center`}>
                <span className="text-xs font-bold text-white text-center">{level.chessCount}</span>
              </div>
              <span className="flex-1 text-sm leading-5 text-gray-600">{level.description}</span>
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
            className="white_icon"
            src={raceJob.imagePath}
            style={{ width: 16, height: 16 }}
          />
          <span className="text-lg font-bold text-white ml-1">{raceJob.name}</span>
        </div>
        {<span className="text-xs text-gray-600">{levels.map((e) => e.chessCount).join('/')}</span>}
      </div>
    </Popover>
  );
};

export default RaceJobItem;
