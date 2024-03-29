'use client';
import {
  ISeasonInfo,
  getChessData,
  getJobData,
  getRaceData,
  getVersionConfig,
} from '@/api/tft';
import RaceJobChessItem from '@/components/tft/RaceJobChessItem';
import RaceJobItem from '@/components/tft/RaceJobItem';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useEffect, useState } from 'react';
import Layout from 'src/components/layout';
import { useMount, usePromise } from 'wwhooks';

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
  useMount(() => {
    updateTaskRes();
  });
  const currentVersion = versionData?.find((item) => item.idSeason === version);
  useEffect(() => {
    if (currentVersion) {
      getChessDataRes(currentVersion.urlChessData);
      getJobDataRes(currentVersion.urlJobData);
      getRaceDataRes(currentVersion.urlRaceData);
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
        <div className="flex flex-col mt-3">
          {races?.map((race, rowIndex) => {
            return (
              <div key={rowIndex} className="flex flex-auto">
                {jobs?.map((job, colIndex) => {
                  const content = () => {
                    if (rowIndex === 0 && colIndex === 0) {
                      return <span className={'min-w-[10rem]'}></span>;
                    }
                    if (rowIndex === 0) {
                      return (
                        <span>
                          <RaceJobItem raceJob={job} />
                        </span>
                      );
                    }
                    if (colIndex === 0) {
                      return (
                        <span className={'min-w-[10rem]'}>
                          <RaceJobItem raceJob={race} />
                        </span>
                      );
                    }
                    return (
                      <RaceJobChessItem
                        version={currentVersion!}
                        races={races}
                        jobs={jobs}
                        race={race}
                        job={job}
                        chesses={chesses}
                      />
                    );
                  };
                  return (
                    <span className="card flex-auto" key={colIndex + colIndex}>
                      {content()}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
