import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';
import React, { useMemo, useRef, useState } from 'react';
import { useObject } from 'wwhooks';

const AddTodoType = { id: '_add', name: '' };

interface Props<T>
  extends Omit<
    AutocompleteProps<T, true, false, false>,
    'onChange' | 'value' | 'renderInput'
  > {
  value: T[];
  options: T[];
  label: string;
  onChange: (value: T[]) => void;
  onAddOption: (name: string) => Promise<T>;
}

function AutoSelect<
  T extends {
    id: string;
    name: string;
  },
>(props: Props<T>) {
  const { value, options, label, onChange, onAddOption, ...otherProps } = props;
  const newOption = useRef('');
  const mergedOptions = [...options, AddTodoType].filter(
    (value, index, self) => {
      return self.indexOf(value) === index;
    },
  ) as T[];
  return (
    <Autocomplete
      {...otherProps}
      options={mergedOptions}
      onChange={async (e, value) => {
        const nextValue = [...value];
        const hasAddTodoType = value.find((v) => v.id === AddTodoType.id);
        if (hasAddTodoType) {
          onAddOption(newOption.current).then((res) => {
            nextValue[nextValue.length - 1] = res;
            if (props.multiple) {
              onChange(nextValue);
            } else {
              onChange([res]);
            }
          });
        }
        const updatedValue = props.multiple
          ? nextValue
          : nextValue.slice(nextValue.length - 1);
        onChange(updatedValue);
      }}
      value={value}
      filterOptions={(options, state) => {
        const displayOptions = options.filter(
          (option) =>
            (option?.name ?? '')
              ?.toLowerCase()
              .trim()
              .includes(state.inputValue.toLowerCase().trim()) ||
            option.id === AddTodoType.id,
        );
        return displayOptions;
      }}
      renderOption={(props, option, state) => {
        if (option.id === AddTodoType.id) {
          if (
            state.inputValue &&
            !options.find((v) => v.name === state.inputValue)
          ) {
            return (
              <li {...props}>
                创建选项
                <strong className="ml-2">{state.inputValue}</strong>
              </li>
            );
          }
          return null;
        }
        return <li {...props}>{option.name}</li>;
      }}
      size="small"
      getOptionLabel={(option) => {
        return option?.name ?? '';
      }}
      fullWidth
      multiple
      isOptionEqualToValue={(option, value) => {
        return option.name === value?.name;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          onChange={(v) => {
            newOption.current = v.target.value;
          }}
        />
      )}
    />
  );
}
export default AutoSelect;
