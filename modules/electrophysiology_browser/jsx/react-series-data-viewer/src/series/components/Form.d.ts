import React from 'react';

type FormValue = string | number | boolean | string[];

type FormElementProps = {
  [key: string]: unknown;
  name?: string;
  value?: FormValue;
  checked?: boolean;
  onUserInput?: (name: string, value: any) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const SelectElement: React.ComponentType<FormElementProps>;
export const NumericElement: React.ComponentType<FormElementProps>;
export const TextareaElement: React.ComponentType<FormElementProps>;
export const TextboxElement: React.ComponentType<FormElementProps>;
export const CheckboxElement: React.ComponentType<FormElementProps>;

export class SelectDropdown extends React.Component<FormElementProps> {
  selected: unknown;
}
