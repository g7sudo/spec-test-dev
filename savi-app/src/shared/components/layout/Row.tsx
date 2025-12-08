import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface RowProps {
  children: React.ReactNode;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justify?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  gap?: number;
  wrap?: boolean;
  style?: ViewStyle;
}

export const Row: React.FC<RowProps> = ({
  children,
  align = 'center',
  justify = 'flex-start',
  gap = 0,
  wrap = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.row,
        {
          alignItems: align,
          justifyContent: justify,
          gap,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

export default Row;
