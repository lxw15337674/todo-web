import React from 'react';
import { ChessImageType, getBorderColor, getChessImage } from './model/Chess';
import { Descriptions, Popover } from 'antd';
import { TFTChess, TFTCard } from '@/api/tft/type';
import { ISeasonInfo } from '@/api/tft';

interface Props {
  race: TFTCard;
  job: TFTCard;
  chesses: TFTChess[];
  races: TFTCard[];
  jobs: TFTCard[];
  version: ISeasonInfo;
  // width: number;
  // height: number;
  // backgroundColor: string;
}

const RaceJobChessItem: React.FC<Props> = ({
  race,
  job,
  chesses,
  races,
  jobs,
  version,
}) => {
  const matchedChesses = chesses?.filter((chess) => {
    const raceIds = chess.raceIds.split(',');
    const jobIds = chess.jobIds.split(',');
    return raceIds.includes(race.id) && jobIds.includes(job.id);
  });

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
          <img
            src={getChessImage(
              version.idSeason,
              chess.TFTID,
              ChessImageType.full,
            )}
            style={{
              position: 'absolute',
              width: imageWidth,
              aspectRatio: 624 / 318,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 56,
              background: 'linear-gradient(#0000, #000A)',
            }}
          ></div>
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
            {chess.skillDetail}
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
      {matchedChesses.map((chess, index) => {
        const borderColor = getBorderColor(chess.price);
        const marginLeft = index === 0 ? 0 : 4;
        return (
          <Popover
            content={renderChessCard(chess)}
            overlayInnerStyle={{ padding: 0 }}
            key={chess.id}
          >
            <img
              src={getChessImage(
                version.idSeason,
                chess.TFTID,
                ChessImageType.head,
              )}
              width={34}
              height={34}
              style={{
                borderRadius: 18,
                borderWidth: 2,
                borderColor,
                borderStyle: 'solid',
                marginLeft,
              }}
            />
          </Popover>
        );
      })}
    </div>
  );
};

export default RaceJobChessItem;
