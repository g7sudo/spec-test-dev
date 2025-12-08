import React from 'react';
import { View } from 'react-native';

interface SpacerProps {
  size?: number;
  horizontal?: boolean;
  flex?: number;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 16,
  horizontal = false,
  flex,
}) => {
  if (flex !== undefined) {
    return <View style={{ flex }} />;
  }

  return (
    <View
      style={{
        width: horizontal ? size : undefined,
        height: horizontal ? undefined : size,
      }}
    />
  );
};

export default Spacer;
