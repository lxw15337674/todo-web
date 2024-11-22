import {
  getChessData,
  getEquipData,
  getJobData,
  getRaceData,
  getVersionConfig,
  ISeasonInfo,
} from '@/api/tft';
import EquipmentBox from '@/components/tft/EquipmentBox';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { getFetter, Item } from '@/utils/tftf';
import { TFTCard, TFTChess } from '@/api/tft/type';
import Equipment from '@/components/tft/Equipment';
import { EquipmentType, TFTEquip } from '@/api/tft/model/Equipment';
import RaceJob from '@/components/tft/RaceJob';
import { ConfigProvider, theme } from 'antd';
import { redirect } from 'next/navigation';
import RaceJobChessItem from '../../src/components/tft/RaceJobChessItem';

export const revalidate = 60 * 60 * 24 * 7;
export const dynamicParams = true;
export async function generateStaticParams({
  params,
}: {
  params: { version: string };
}) {
  const posts = await fetch('https://api.vercel.app/blog').then((res) =>
    res.json(),
  );
  console.log(posts);
  const versionData = await getVersionConfig();
  debugger;
  const currentVersion = versionData[0];
  const chesses = await getChessData(currentVersion.urlChessData);
  const jobs = await getJobData(currentVersion.urlJobData);
  const races = await getRaceData(currentVersion.urlRaceData);
  const equips = await getEquipData(currentVersion.urlEquipData);
  const items = getFetter(jobs, races, chesses);
  return {
    versionData,
    items,
    jobs,
    races,
    equips,
    currentVersion: versionData.find(
      (item) => item.idSeason === params.version || versionData[0].idSeason,
    ),
  };
}

interface Props {
  versionData: ISeasonInfo[];
  items: Item[][];
  jobs: TFTCard[];
  races: TFTCard[];
  equips: Map<EquipmentType, TFTEquip[]>;
  currentVersion: ISeasonInfo;
}
export default async function IndexPage({ params }: { params: Props }) {
  const { versionData, items, jobs, races, equips, currentVersion } = params;
  console.log(params, versionData);
  return (
    <div className="p-3 bg-[#141329] text-white">
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <FormControl fullWidth>
          <InputLabel>版本</InputLabel>
          <Select
            value={currentVersion}
            label="版本"
            onChange={(e) => {
              redirect(`/tft?version=${e.target.value}`);
            }}
          >
            {versionData?.map((item) => {
              return (
                <MenuItem value={item.idSeason} key={item.idSeason}>
                  {item.stringName}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
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
      </ConfigProvider>
    </div>
  );
}
