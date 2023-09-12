import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';
import React, { useMemo, useRef, useState } from 'react';
import { useObject } from 'wwhooks';

const AddTodoType = '_add';

interface Props
  extends Omit<
    AutocompleteProps<string, true, false, false>,
    'onChange' | 'value' | 'renderInput'
  > {
  value: string | undefined;
  options: string[];
  label: string;
  onChange: (value: string) => void;
}

const AutoSelect = (props: Props) => {
  const { value, options, label, onChange, ...otherProps } = props;
  const newOption = useRef('');
  const mergedOptions = [
    ...options,
    ...(value?.split(',')?.filter((v) => !!v) ?? []),
    AddTodoType,
  ].filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
  return (
    <Autocomplete
      {...otherProps}
      options={mergedOptions}
      onChange={(e, value) => {
        const nextValue = [...value];
        const hasAddTodoType = value.includes(AddTodoType);
        if (hasAddTodoType) {
          if (!props.multiple) {
            onChange(newOption.current);
            return;
          }
          nextValue[nextValue.length - 1] = newOption.current;
        }

        const updatedValue = props.multiple
          ? nextValue.join(',')
          : value[value.length - 1];
        onChange(updatedValue);
      }}
      value={value?.split(',').filter((v) => !!v) ?? []}
      filterOptions={(options, state) => {
        const displayOptions = options.filter(
          (option) =>
            option
              .toLowerCase()
              .trim()
              .includes(state.inputValue.toLowerCase().trim()) ||
            option === AddTodoType,
        );

        return displayOptions;
      }}
      renderOption={(props, option, state, ownState) => {
        if (option === AddTodoType) {
          if (
            state.inputValue &&
            ownState.options.indexOf(state.inputValue) === -1
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
        return <li {...props}>{option}</li>;
      }}
      size="small"
      getOptionLabel={(option) => {
        return option;
      }}
      fullWidth
      multiple
      isOptionEqualToValue={(option, value) => {
        if (option === AddTodoType) {
          return false;
        }
        return option === value;
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
};
export default AutoSelect;
