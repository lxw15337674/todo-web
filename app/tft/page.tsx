import {
  getChessData,
  getEquipData,
  getJobData,
  getRaceData,
  getVersionConfig,
} from '@/api/tft';
import EquipmentBox from '@/public/app/tft/components/EquipmentBox';
import { Typography } from '@mui/material';
import { getFetter } from '@/utils/tftf';
import { TFTCard, TFTChess } from '@/api/tft/type';
import Equipment from '@/public/app/tft/components/Equipment';
import {
  EquipmentType,
  EquipsByType,
  TFTEquip,
} from '@/api/tft/model/Equipment';
import RaceJob from '@/public/app/tft/components/RaceJob';
import RaceJobChessItem from './components/RaceJobChessItem';
import VersionSelect from './components/VersionSelect';

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { version } = await searchParams;
  const versionData = await getVersionConfig();
  const currentVersion =
    versionData.find((item) => item.idSeason === version) ?? versionData[0];
  const chesses = await getChessData(currentVersion.urlChessData);
  const jobs = await getJobData(currentVersion.urlJobData);
  const races = await getRaceData(currentVersion.urlRaceData);
  const equips = (await getEquipData(currentVersion.urlEquipData)).reduce(
    (acc: EquipsByType, equip: TFTEquip) => {
      return acc.set(equip.type, (acc.get(equip.type) || []).concat(equip));
    },
    new Map(),
  );
  const items = getFetter(jobs, races, chesses);
  return (
    <div className="p-3  ">
      <VersionSelect
        currentVersion={currentVersion}
        versionData={versionData}
      />
      <Typography variant="h5" gutterBottom>
        羁绊公式
      </Typography>
      <div className="flex flex-col mt-3 border border-gray-950">
        {items?.map((rows, rowIndex) => {
          return (
            <div key={rowIndex} className="flex">
              {rows?.map((item, colIndex) => {
                if (rowIndex === 0 && colIndex === 0) {
                  return (
                    <span
                      className="card border-gray-950 min-w-[10rem]"
                      key={colIndex + colIndex}
                    ></span>
                  );
                }
                if (rowIndex === 0) {
                  return (
                    <span
                      className="card border-l border-gray-950 min-w-[6rem]"
                      key={colIndex + colIndex}
                    >
                      <RaceJob raceJob={item as TFTCard} />
                    </span>
                  );
                }
                if (colIndex === 0) {
                  return (
                    <span
                      className="card border-t border-gray-950 min-w-[10rem]"
                      key={colIndex + colIndex}
                    >
                      <RaceJob raceJob={item as TFTCard} />
                    </span>
                  );
                }
                return (
                  <span
                    className="card border-l border-t border-gray-950 min-w-[6rem]"
                    key={colIndex + colIndex}
                  >
                    {currentVersion && (
                      <RaceJobChessItem
                        version={currentVersion}
                        races={races}
                        jobs={jobs}
                        chesses={item as TFTChess[]}
                      />
                    )}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="mt-2">
        <Typography variant="h5" gutterBottom>
          装备公式
        </Typography>
        <EquipmentBox equipsByType={equips} />
      </div>
      {equips.get(EquipmentType['ink']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            额外装备
          </Typography>
          {equips.get(EquipmentType['ink'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['job']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            无法合成的特殊转职纹章
          </Typography>
          {equips.get(EquipmentType['job'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['ornn']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            奥恩神器
          </Typography>
          {equips.get(EquipmentType['ornn'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['golden']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            金鳞龙装备
          </Typography>
          {equips.get(EquipmentType['golden'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['support']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            辅助装备
          </Typography>
          {equips.get(EquipmentType['support'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
    </div>
  );
}
