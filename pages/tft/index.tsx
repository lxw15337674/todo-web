'use client';
import {
  ISeasonInfo,
  getChessData,
  getEquipData,
  getJobData,
  getRaceData,
  getVersionConfig,
} from '@/api/tft';
import EquipmentBox from '@/components/tft/EquipmentBox';
import RaceJobChessItem from '@/components/tft/RaceJobChessItem';
import RaceJobItem from '@/components/tft/RaceJobItem';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import Layout from 'src/components/layout';
import { useMount, usePromise } from 'wwhooks';
import { Typography } from 'antd';
import { getFetter } from '@/utils/tftf';
import { TFTCard, TFTChess } from '@/api/tft/type';
import Equipment from '@/components/tft/Equipment';
import { EquipmentType, TFTEquip } from '@/api/tft/model/Equipment';

const { Title } = Typography;

export default function IndexPage() {
  const [versionData, setVersionData] = useState<ISeasonInfo[]>([]);
  const [version, setVersion] = useState('');
  const { run: updateTaskRes } = usePromise(getVersionConfig, {
    onSuccess: (data) => {
      if (data) {
        setVersionData(data);
        setVersion(data[0].idSeason);
      }
    },
  });
  const { data: chesses, run: getChessDataRes } = usePromise(getChessData, {
    initialData: [],
  });
  const { data: jobs, run: getJobDataRes } = usePromise(getJobData, {
    initialData: [],
  });
  const { data: races, run: getRaceDataRes } = usePromise(getRaceData, {
    initialData: [],
  });

  const { data: equips, run: getEquipDataRes } = usePromise(getEquipData, {
    initialData: new Map([]),
  });
  useMount(() => {
    updateTaskRes();
  });
  const currentVersion = versionData?.find((item) => item.idSeason === version);
  useEffect(() => {
    if (currentVersion) {
      getChessDataRes(currentVersion.urlChessData);
      getJobDataRes(currentVersion.urlJobData);
      getRaceDataRes(currentVersion.urlRaceData);
      getEquipDataRes(currentVersion.urlEquipData);
    }
  }, [version]);
  const items = useMemo(() => {
    return getFetter(jobs, races, chesses);
  }, [jobs, races, chesses]);

  return (
    <Layout>
      <div className="m-3">
        <FormControl fullWidth>
          <InputLabel>版本</InputLabel>
          <Select
            value={version}
            label="版本"
            onChange={(e) => {
              setVersion(e.target.value);
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
        <Title level={2}>羁绊公式</Title>
        <div className="flex flex-col mt-3 border border-gray-950">
          {items?.map((rows, rowIndex) => {
            return (
              <div key={rowIndex} className="flex">
                {rows?.map((item, colIndex) => {
                  if (rowIndex === 0 && colIndex === 0) {
                    return (
                      <span
                        className="card    border-gray-950 min-w-[10rem]"
                        key={colIndex + colIndex}
                      ></span>
                    );
                  }
                  if (rowIndex === 0) {
                    return (
                      <span
                        className="card    border-l     border-gray-950 min-w-[6rem]"
                        key={colIndex + colIndex}
                      >
                        <RaceJobItem raceJob={item as TFTCard} />
                      </span>
                    );
                  }
                  if (colIndex === 0) {
                    return (
                      <span
                        className="card  border-t  border-gray-950 min-w-[10rem]"
                        key={colIndex + colIndex}
                      >
                        <RaceJobItem raceJob={item as TFTCard} />
                      </span>
                    );
                  }
                  return (
                    <span
                      className="card   border-l border-t border-gray-950 min-w-[6rem]"
                      key={colIndex + colIndex}
                    >
                      <RaceJobChessItem
                        version={currentVersion!}
                        races={races}
                        jobs={jobs}
                        chesses={item as TFTChess[]}
                      />
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="mt-2">
          <Title level={2}>装备公式</Title>
          <EquipmentBox equipsByType={equips} />
        </div>
        {equips.get(EquipmentType['ink']) && (
          <div className="mt-2">
            <Title level={2}>额外装备</Title>
            {equips.get(EquipmentType['ink'])?.map((equip: TFTEquip) => {
              return <Equipment equip={equip} key={equip.equipId} />;
            })}
          </div>
        )}
        {equips.get(EquipmentType['job']) && (
          <div className="mt-2">
            <Title level={2}>无法合成的特殊转职纹章</Title>
            {equips.get(EquipmentType['job'])?.map((equip: TFTEquip) => {
              return <Equipment equip={equip} key={equip.equipId} />;
            })}
          </div>
        )}
        {equips.get(EquipmentType['ornn']) && (
          <div className="mt-2">
            <Title level={2}>奥恩神器</Title>
            {equips.get(EquipmentType['ornn'])?.map((equip: TFTEquip) => {
              return <Equipment equip={equip} key={equip.equipId} />;
            })}
          </div>
        )}
        {equips.get(EquipmentType['golden']) && (
          <div className="mt-2">
            <Title level={2}>金鳞龙装备</Title>
            {equips.get(EquipmentType['golden'])?.map((equip: TFTEquip) => {
              return <Equipment equip={equip} key={equip.equipId} />;
            })}
          </div>
        )}
        {equips.get(EquipmentType['support']) && (
          <div className="mt-2">
            <Title level={2}>辅助装备</Title>
            {equips.get(EquipmentType['support'])?.map((equip: TFTEquip) => {
              return <Equipment equip={equip} key={equip.equipId} />;
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
