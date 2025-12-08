import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface ColumnProps {
  children: React.ReactNode;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  gap?: number;
  style?: ViewStyle;
}

export const Column: React.FC<ColumnProps> = ({
  children,
  align = 'stretch',
  justify = 'flex-start',
  gap = 0,
  style,
}) => {
  return (
    <View
      style={[
        styles.column,
        {
          alignItems: align,
          justifyContent: justify,
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
});

export default Column;
