import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useBoolean, useObject, useUpdateEffect } from 'wwhooks';
import { Autocomplete, Stack } from '@mui/material';
import { createCount, updateCount } from '@/api/count/count';
import { useCountStore } from 'store/count';
import { UpdateCountMeta } from '@/api/count/interface';
import { LoadingButton } from '@mui/lab';

export const CountTypes = [
  {
    name: '循环计数',
    key: 'count',
  },
  {
    name: '按天计数',
    key: 'day',
  },
  // {
  //   name: '一次性计数',
  //   key: 'once'
  // },
  // {
  //   name: '按周计数',
  //   desc: '按周计数(会显示当周次数)'
  // }
];

interface Form {
  name: string;
  type: string;
  remark: string;
  id?: string;
}

export default function CountForm() {
  const { setStore, editFormVisible, editCount } = useCountStore();

  const [form, setForm] = useObject<Form>({
    type: CountTypes[0].key,
    name: '',
    remark: '',
  });

  const [error, setError] = useBoolean(false);
  const [loading, setLoading] = useBoolean(false);
  useUpdateEffect(() => {
    if (editCount) {
      setForm({
        name: editCount?.name ?? '',
        type: editCount?.type ?? '',
        remark: editCount?.remark ?? '',
        id: editCount?.id,
      });
    } else {
      setForm({
        name: '',
        type: CountTypes[0].key,
        remark: '',
        id: undefined,
      });
    }
    setLoading(false);
    setError(false);
  }, [editFormVisible]);

  const handleClose = () => {
    setStore({
      editFormVisible: false,
    });
  };

  const submit = async () => {
    if (!form.name) {
      setError(true);
      return;
    }
    setLoading(true);
    if (form?.id) {
      await updateCount(form as UpdateCountMeta);
    } else {
      await createCount(form);
    }
    setStore({
      editFormVisible: false,
      editCountId: undefined,
    });
  };

  return (
    <Dialog open={editFormVisible} fullWidth maxWidth="md">
      <DialogTitle>新建计数</DialogTitle>
      <DialogContent>
        <Stack spacing={2} className="py-2">
          <TextField
            size="small"
            autoFocus
            id="name"
            label="名称"
            required
            fullWidth
            error={error}
            value={form?.name ?? ''}
            onChange={(e) => {
              setForm({
                name: e.target.value,
              });
            }}
            inputProps={{
              maxLength: 40,
            }}
          />
          <Autocomplete
            size="small"
            value={CountTypes.find((item) => item.key === form?.type) ?? null}
            onChange={(event, newValue) => {
              setForm({
                type: newValue?.key ?? '',
              });
            }}
            options={CountTypes}
            renderOption={(props, option) => {
              return (
                <li {...props}>
                  <div className="flex justify-between w-full">
                    <div>{option.name}</div>
                  </div>
                </li>
              );
            }}
            getOptionLabel={(option) => {
              return option?.name ?? '';
            }}
            renderInput={(params) => <TextField {...params} label="类型" />}
          />
          <TextField
            size="small"
            fullWidth
            label="备注"
            multiline
            inputProps={{
              maxLength: 40,
            }}
            rows={2}
            id="outlined-multiline-static"
            value={form?.remark ?? ''}
            onChange={(e) => {
              setForm({
                remark: e.target.value,
              });
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>取消</Button>
        <LoadingButton
          loading={loading}
          onClick={() => {
            submit();
          }}
        >
          提交
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
