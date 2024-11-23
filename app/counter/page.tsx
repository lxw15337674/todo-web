'use client';
import Layout from 'src/components/layout';
import { useDebounceFn, useMount, useObject } from 'wwhooks';
import {
  Grid,
  List,
  Paper,
  InputAdornment,
  InputBase,
  Fab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useMemo } from 'react';
import { useCountStore } from 'store/counter';
import { findAllWithCounter } from '@/api/counter';
import AddIcon from '@mui/icons-material/Add';
import CountForm from '@/components/Counter/CounterFormDialog';
import CountCard from '@/components/Counter/CounterCard';
import CountInfoDrawer from '@/components/Counter/CounterInfoDrawer';

export default function IndexPage() {
  const { counts, setStore } = useCountStore((state) => ({
    counts: state.counts,
    setStore: state.setStore,
  }));
  const [state, setState] = useObject({
    search: '',
    anchorEl: null as (EventTarget & HTMLButtonElement) | null,
    newCountType: '',
  });
  useMount(() => {
    findAllWithCounter();
  });
  const [onFilter] = useDebounceFn((v) => {
    setState({
      search: v,
    });
  });

  const filteredCount = useMemo(() => {
    return counts?.filter((count) => {
      if (count?.type?.includes(state.search)) {
        return true;
      }
      if (count?.type?.includes(state.search)) {
        return true;
      }
    });
  }, [counts, state.search]);

  return (
    <>
      <CountInfoDrawer />
      <div className="flex h-full">
        <div className="flex-1 m-3 flex flex-col ">
          <Fab
            color="primary"
            aria-label="add"
            className="absolute bottom-[16px] right-[16px] bg-primary"
            onClick={() => {
              setStore({
                editFormVisible: true,
              });
            }}
          >
            <AddIcon />
          </Fab>
          <CountForm />
          <div className="flex w-full">
            <Paper className="flex mb-4  w-full items-center" elevation={2}>
              <InputAdornment position="start" className="m-2">
                <SearchIcon fontSize="small" />
              </InputAdornment>
              <InputBase
                fullWidth
                className="mr-4 w-60"
                placeholder="筛选"
                onChange={(e) => {
                  onFilter(e.target.value);
                }}
              />
            </Paper>
          </div>

          <div className=" overflow-auto flex-1 ">
            <List>
              <Grid container spacing={2}>
                {filteredCount?.map((count) => (
                  <Grid item xs={6} key={count.id}>
                    <CountCard data={count} />
                  </Grid>
                ))}
              </Grid>
            </List>
          </div>
        </div>
      </div>
    </>
  );
}
