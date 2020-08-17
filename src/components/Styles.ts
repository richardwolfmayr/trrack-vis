import { style } from 'typestyle';

export const treeColor = (current?: boolean) => {
  return style({
    fill: current ? 'rgb(88, 22, 22)' : 'white',
    stroke: 'rgb(88, 22, 22)'
  });
};
