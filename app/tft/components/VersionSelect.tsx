'use client';
import { Select, FormControl, InputLabel, MenuItem } from '@mui/material';
import { redirect } from 'next/navigation';
import { ISeasonInfo } from '../../../src/api/tft';

interface Props {
  versionData: ISeasonInfo[];
  currentVersion: ISeasonInfo;
}
const VersionSelect = ({ versionData, currentVersion }: Props) => {
  return (
    <FormControl fullWidth>
      <Select
        value={currentVersion.idSeason}
        label="版本"
        onChange={(e) => {
          redirect(`/tft?version=${e.target.value}`);
        }}
        className="border-[1px] mb-2"
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
  );
};

export default VersionSelect;
