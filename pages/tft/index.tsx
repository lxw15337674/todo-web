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
import { useEffect, useState } from 'react';
import Layout from 'src/components/layout';
import { useMount, usePromise } from 'wwhooks';
import { Typography } from 'antd';

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
        <div className="flex flex-col mt-3 border border-gray-950">
          {races?.map((race, rowIndex) => {
            return (
              <div key={rowIndex} className="flex flex-auto">
                {jobs?.map((job, colIndex) => {
                  if (rowIndex === 0 && colIndex === 0) {
                    return (
                      <span
                        className="card flex-auto min-w-[10rem]  border-gray-950"
                        key={colIndex + colIndex}
                      ></span>
                    );
                  }
                  if (rowIndex === 0) {
                    return (
                      <span
                        className="card flex-auto   border-l     border-gray-950"
                        key={colIndex + colIndex}
                      >
                        <RaceJobItem raceJob={job} />
                      </span>
                    );
                  }
                  if (colIndex === 0) {
                    return (
                      <span
                        className="card flex-auto border-t  min-w-[10rem] border-gray-950"
                        key={colIndex + colIndex}
                      >
                        <RaceJobItem raceJob={race} />
                      </span>
                    );
                  }
                  return (
                    <span
                      className="card flex-auto  border-l border-t border-gray-950"
                      key={colIndex + colIndex}
                    >
                      <RaceJobChessItem
                        version={currentVersion!}
                        races={races}
                        jobs={jobs}
                        race={race}
                        job={job}
                        chesses={chesses}
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
      </div>
    </Layout>
  );
}
