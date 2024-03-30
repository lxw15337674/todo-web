import React from 'react';
import {
  ChessImageType,
  getBorderColor,
  getChessImage,
} from '../../api/tft/model/Chess';
import { Descriptions, Popover,  Avatar } from 'antd';
import { TFTChess, TFTCard } from '@/api/tft/type';
import { ISeasonInfo } from '@/api/tft';
import { Desc } from './Desc';

interface Props {
  races: TFTCard[];
  jobs: TFTCard[];
  chesses: TFTChess[];
  version: ISeasonInfo;
}

const RaceJobChessItem: React.FC<Props> = ({
  chesses,
  races,
  jobs,
  version,
}) => {
  const renderChessCard = (chess: TFTChess) => {
    const imageWidth = 360;
    const raceJobs: TFTCard[] = [];
    for (const id of chess.raceIds.split(',')) {
      const race = races.find((race) => race.id === id);
      if (race) {
        raceJobs.push(race);
      }
    }

    for (const id of chess.jobIds.split(',')) {
      const job = jobs.find((job) => job.id === id);
      if (job) {
        raceJobs.push(job);
      }
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 8,
          width: imageWidth,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: imageWidth,
            aspectRatio: 624 / 318,
          }}
        >
          <Avatar 
            shape="square" 
            style={{
              height:'100%',
              width:'100%',
              border:0
            }}
          src={getChessImage(
            version.idSeason,
            chess.TFTID,
            ChessImageType.full,
          )} />
          <div
            style={{
              position: 'absolute',
              left: 20,
              bottom: 16,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {raceJobs.map((raceJob) => {
              return (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                  key={raceJob.id}
                >
                  <img
                    className={'white-icon'}
                    src={raceJob.imagePath}
                    style={{ width: 16, height: 16, marginRight: 4 }}
                  />
                  <span style={{ fontSize: 15, color: 'white' }}>
                    {raceJob.name}
                  </span>
                </div>
              );
            })}
            <span
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: 'white',
                marginTop: 8,
              }}
            >
              {chess.title} {chess.displayName}
            </span>
          </div>
        </div>
        <Descriptions
          layout={'vertical'}
          column={3}
          bordered
          size={'small'}
          style={{ margin: 16, width: imageWidth - 32 }}
          labelStyle={{
            fontSize: 12,
            fontWeight: 'bold',
            color: '#9e9e9e',
            textAlign: 'center',
          }}
          contentStyle={{ fontSize: 13, color: '#212121' }}
          items={[
            { label: '生命', children: chess.life },
            { label: '护甲', children: chess.armor },
            { label: '魔抗', children: chess.spellBlock },
            { label: '攻击', children: chess.attack },
            { label: '攻速', children: chess.attackSpeed },
            { label: '暴击', children: chess.crit },
            { label: '攻击距离', children: chess.attackRange },
            { label: '初始法力值', children: chess.startMagic || '0' },
            { label: '最大法力值', children: chess.magic || '0' },
          ]}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: 16,
            paddingRight: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}
          >
            <img
              src={chess.originalImage}
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
            <span
              style={{ fontSize: 20, fontWeight: 'bold', color: '#212121' }}
            >
              {chess.skillName}
            </span>
          </div>
          <span style={{ fontSize: 13, color: '#212121' }}>
            <Desc text={chess.skillDetail}/>
          </span>
        </div>
      </div>
    );
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {chesses?.map((chess, index) => {
        const borderColor = getBorderColor(chess.price);
        return (
          <Popover
            content={renderChessCard(chess)}
            overlayInnerStyle={{ padding: 0 }}
          >
            <Avatar
              src={getChessImage(
                version.idSeason,
                chess.TFTID,
                ChessImageType.head,
              )}
              shape="square" size="large"
              className='cursor-pointer ml-1'
              style={{
                borderWidth: 2,
                borderColor,
                borderStyle: 'solid',
              }}
            />
          </Popover>
        );
      })}
    </div>
  );
};

export default RaceJobChessItem;
