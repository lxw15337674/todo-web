'use client'
import React from 'react';
import { TFTCard } from '@/api/tft/type';
import Popover from '@mui/material/Popover';
import {
  getRaceJobLevelBorderColor,
  getRaceJobLevelColor,
} from '../../../src/api/tft/model/RaceJob';
import { Avatar } from '@mui/material';
import Image from 'next/image';

interface Props {
  raceJob: TFTCard;
}

const RaceJob = ({ raceJob }: Props) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  return (
    <div>
      <div
        className={`flex flex-col   m-0.5 items-center 
                cursor-pointer
                justify-center`}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      >
        <div className="flex items-center">
          <Image
            className="white-icon"
            src={raceJob.imagePath}
            alt={raceJob.name}
            width={16}
            height={16}
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
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none',
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <div className="flex flex-col p-4 ">
          <span className="text-base ">{raceJob.introduce}</span>
          {raceJob.level?.map((level, index) => {
            return (
              <div className={`flex-center`} key={index}>
                <div
                  className={`flex-center w-5 h-5 m-1`}
                  style={{
                    backgroundColor: getRaceJobLevelColor(level.color),
                    borderColor: getRaceJobLevelBorderColor(level.color),
                  }}
                >
                  <span className="text-xs font-bold text-white text-center">
                    {level.chessCount}
                  </span>
                </div>
                <span className="flex-1 text-sm leading-5 text-gray-200">
                  {level.description}
                </span>
              </div>
            );
          })}
        </div>
      </Popover>
    </div>
  );
};

export default RaceJob;
